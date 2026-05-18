"""replace ratings with votes and reports

Revision ID: b7f9a2e0c4d1
Revises: 898c8c503886
Create Date: 2026-05-19 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "b7f9a2e0c4d1"
down_revision: Union[str, None] = "898c8c503886"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


vote_type_enum = postgresql.ENUM("like", "dislike", name="document_vote_type_enum", create_type=False)
report_reason_enum = postgresql.ENUM(
    "spam",
    "incorrect",
    "copyright",
    "inappropriate",
    "other",
    name="document_report_reason_enum",
    create_type=False,
)
report_status_enum = postgresql.ENUM(
    "pending",
    "reviewed",
    "resolved",
    "dismissed",
    name="document_report_status_enum",
    create_type=False,
)


def upgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            CREATE TYPE document_vote_type_enum AS ENUM ('like', 'dislike');
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
        """
    )
    op.execute(
        """
        DO $$
        BEGIN
            CREATE TYPE document_report_reason_enum AS ENUM
                ('spam', 'incorrect', 'copyright', 'inappropriate', 'other');
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
        """
    )
    op.execute(
        """
        DO $$
        BEGIN
            CREATE TYPE document_report_status_enum AS ENUM
                ('pending', 'reviewed', 'resolved', 'dismissed');
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
        """
    )

    op.add_column("documents", sa.Column("like_count", sa.Integer(), server_default=sa.text("0"), nullable=False))
    op.add_column("documents", sa.Column("dislike_count", sa.Integer(), server_default=sa.text("0"), nullable=False))
    op.add_column("documents", sa.Column("report_count", sa.Integer(), server_default=sa.text("0"), nullable=False))

    op.create_check_constraint("chk_like_count_positive", "documents", "like_count >= 0")
    op.create_check_constraint("chk_dislike_count_positive", "documents", "dislike_count >= 0")
    op.create_check_constraint("chk_report_count_positive", "documents", "report_count >= 0")

    op.drop_constraint("chk_rating_avg_range", "documents", type_="check")
    op.drop_constraint("chk_rating_count_positive", "documents", type_="check")
    op.drop_column("documents", "rating_average")
    op.drop_column("documents", "rating_count")

    op.drop_index("ix_ratings_user_id", table_name="document_ratings")
    op.drop_index("ix_ratings_document_id", table_name="document_ratings")
    op.drop_table("document_ratings")

    op.create_table(
        "document_votes",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("document_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("vote_type", vote_type_enum, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("document_id", "user_id", name="uq_document_votes_document_user"),
    )
    op.create_index("ix_document_votes_document_id", "document_votes", ["document_id"], unique=False)
    op.create_index("ix_document_votes_user_id", "document_votes", ["user_id"], unique=False)
    op.create_index(
        "ix_document_votes_document_vote_type",
        "document_votes",
        ["document_id", "vote_type"],
        unique=False,
    )

    op.create_table(
        "document_reports",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("document_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("reason", report_reason_enum, nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", report_status_enum, server_default=sa.text("'pending'"), nullable=False),
        sa.Column("admin_note", sa.Text(), nullable=True),
        sa.Column("reviewed_by", sa.UUID(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewed_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("document_id", "user_id", name="uq_document_reports_document_user"),
    )
    op.create_index("ix_document_reports_document_id", "document_reports", ["document_id"], unique=False)
    op.create_index("ix_document_reports_user_id", "document_reports", ["user_id"], unique=False)
    op.create_index("ix_document_reports_status", "document_reports", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_document_reports_status", table_name="document_reports")
    op.drop_index("ix_document_reports_user_id", table_name="document_reports")
    op.drop_index("ix_document_reports_document_id", table_name="document_reports")
    op.drop_table("document_reports")

    op.drop_index("ix_document_votes_document_vote_type", table_name="document_votes")
    op.drop_index("ix_document_votes_user_id", table_name="document_votes")
    op.drop_index("ix_document_votes_document_id", table_name="document_votes")
    op.drop_table("document_votes")

    op.add_column(
        "documents",
        sa.Column("rating_count", sa.Integer(), server_default=sa.text("0"), nullable=False),
    )
    op.add_column(
        "documents",
        sa.Column("rating_average", sa.Numeric(precision=2, scale=1), server_default=sa.text("0.0"), nullable=False),
    )
    op.create_check_constraint("chk_rating_count_positive", "documents", "rating_count >= 0")
    op.create_check_constraint("chk_rating_avg_range", "documents", "rating_average >= 0.0 AND rating_average <= 5.0")

    op.drop_constraint("chk_report_count_positive", "documents", type_="check")
    op.drop_constraint("chk_dislike_count_positive", "documents", type_="check")
    op.drop_constraint("chk_like_count_positive", "documents", type_="check")
    op.drop_column("documents", "report_count")
    op.drop_column("documents", "dislike_count")
    op.drop_column("documents", "like_count")

    op.create_table(
        "document_ratings",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("document_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column(
            "score",
            sa.Numeric(precision=2, scale=1),
            nullable=False,
            comment="Rating score from 0.5 to 5.0 (in 0.5 increments)",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("score >= 0.5 AND score <= 5.0 AND (score * 2) % 1 = 0", name="chk_score_valid"),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("document_id", "user_id", name="uq_doc_user_rating"),
    )
    op.create_index("ix_ratings_document_id", "document_ratings", ["document_id"], unique=False)
    op.create_index("ix_ratings_user_id", "document_ratings", ["user_id"], unique=False)

    op.execute("DROP TYPE IF EXISTS document_report_status_enum")
    op.execute("DROP TYPE IF EXISTS document_report_reason_enum")
    op.execute("DROP TYPE IF EXISTS document_vote_type_enum")
