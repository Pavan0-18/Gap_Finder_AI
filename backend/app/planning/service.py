from datetime import date, datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.all_models import (
    RevisionPlan,
    RevisionTask,
    Subject,
    Topic,
    TopicMastery,
)

class RevisionPlanningService:
    def __init__(self, db: Session):
        self.db = db

    def generate_revision_plan(
        self,
        user_id: str,
        subject_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        daily_hours: Optional[float] = None,
    ) -> RevisionPlan:
        subject = self.db.query(Subject).filter(Subject.id == subject_id).first()
        if not subject:
            raise ValueError(f"Subject {subject_id} not found")

        plan_start = start_date or date.today()
        plan_end = end_date or subject.target_exam_date or (plan_start + timedelta(days=14))
        allocated_daily = daily_hours or subject.daily_study_hours or 2.0
        daily_minutes = int(allocated_daily * 60)

        # Check existing active plans
        prev_plan = (
            self.db.query(RevisionPlan)
            .filter(
                RevisionPlan.subject_id == subject_id,
                RevisionPlan.user_id == user_id,
                RevisionPlan.status == "ACTIVE"
            )
            .order_by(RevisionPlan.version.desc())
            .first()
        )

        completed_tasks_preserved = []
        adaptation_reason = None
        new_version = 1

        if prev_plan:
            new_version = prev_plan.version + 1
            prev_plan.status = "SUPERSEDED"
            # Extract completed tasks to preserve
            done_tasks = (
                self.db.query(RevisionTask)
                .filter(
                    RevisionTask.revision_plan_id == prev_plan.id,
                    RevisionTask.is_completed == True
                )
                .all()
            )
            completed_tasks_preserved = done_tasks
            adaptation_reason = (
                f"Adapted from Version {prev_plan.version} following updated diagnostic assessment. "
                f"Preserved {len(done_tasks)} completed task(s) and reallocated remaining schedule."
            )

        new_plan = RevisionPlan(
            subject_id=subject_id,
            user_id=user_id,
            version=new_version,
            start_date=plan_start,
            end_date=plan_end,
            daily_allocated_hours=allocated_daily,
            status="ACTIVE",
            summary=f"Adaptive {round((plan_end - plan_start).days, 0)}-day targeted revision schedule focusing on weakest high-yield topics.",
            adaptation_reason=adaptation_reason,
        )
        self.db.add(new_plan)
        self.db.flush()

        # Re-attach preserved completed tasks
        task_order = 0
        for dt in completed_tasks_preserved:
            cloned_task = RevisionTask(
                revision_plan_id=new_plan.id,
                topic_id=dt.topic_id,
                scheduled_date=dt.scheduled_date,
                allocated_minutes=dt.allocated_minutes,
                priority_score=dt.priority_score,
                recommended_activity=dt.recommended_activity,
                learning_objective=dt.learning_objective,
                supporting_material=dt.supporting_material,
                expected_outcome=dt.expected_outcome,
                is_completed=True,
                completed_at=dt.completed_at,
                order_index=task_order,
            )
            self.db.add(cloned_task)
            task_order += 1

        # Calculate Topic Priorities: P = 0.50*G + 0.30*I + 0.20*U
        topics = self.db.query(Topic).filter(Topic.subject_id == subject_id).all()
        topic_priorities = []

        days_to_exam = max(1, (plan_end - plan_start).days)
        urgency = max(0.0, 100.0 * (1.0 - (days_to_exam / 60.0)))

        for t in topics:
            mastery_rec = self.db.query(TopicMastery).filter(
                TopicMastery.user_id == user_id,
                TopicMastery.topic_id == t.id
            ).first()

            if not mastery_rec or mastery_rec.status == "NOT_ASSESSED":
                gap = 75.0  # high gap assumption for unassessed
            else:
                gap = max(0.0, 100.0 - mastery_rec.mastery_score)

            importance = (t.exam_importance or 0.5) * 100.0
            priority = (0.50 * gap) + (0.30 * importance) + (0.20 * urgency)
            topic_priorities.append((priority, t, mastery_rec))

        # Sort topics descending by priority
        topic_priorities.sort(key=lambda x: x[0], reverse=True)

        # Distribute tasks into daily buckets
        total_days = max(1, (plan_end - plan_start).days)
        current_day_offset = 0
        current_day_used_minutes = 0

        for prio, topic, m_rec in topic_priorities:
            # Determine activity type and duration based on mastery
            status = m_rec.status if m_rec else "NOT_ASSESSED"
            if status in ["WEAK", "NOT_ASSESSED"]:
                duration = 50
                activity = "CONCEPT_REVIEW" if status == "NOT_ASSESSED" else "MISCONCEPTION_DRILL"
                outcome = f"Master core definitions and remediate misconceptions in {topic.name}."
            elif status == "MEDIUM":
                duration = 40
                activity = "PRACTICE_QUESTIONS"
                outcome = f"Target remaining learning objectives in {topic.name}."
            else:
                duration = 20
                activity = "RETENTION_CHECK"
                outcome = f"Spaced retention check for {topic.name}."

            # Advance day if daily limit exceeded
            if (current_day_used_minutes + duration) > daily_minutes:
                current_day_offset += 1
                current_day_used_minutes = 0
                if current_day_offset >= total_days:
                    # Loop back or fit into remaining days
                    current_day_offset = total_days - 1

            scheduled_date = plan_start + timedelta(days=current_day_offset)

            task = RevisionTask(
                revision_plan_id=new_plan.id,
                topic_id=topic.id,
                scheduled_date=scheduled_date,
                allocated_minutes=duration,
                priority_score=round(prio, 1),
                recommended_activity=activity,
                learning_objective=topic.learning_objectives[0] if topic.learning_objectives else f"Mastery of {topic.name}",
                supporting_material=f"Textbook Chapter: {topic.chapter or topic.unit or 'Core Materials'}",
                expected_outcome=outcome,
                is_completed=False,
                order_index=task_order,
            )
            self.db.add(task)
            task_order += 1
            current_day_used_minutes += duration

        self.db.commit()
        self.db.refresh(new_plan)
        return new_plan
