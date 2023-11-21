"""merging two heads

Revision ID: 3562287f5ee5
Revises: 69b0b93484cb, fca025d3b60f
Create Date: 2023-11-21 07:34:58.879862

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3562287f5ee5'
down_revision = ('69b0b93484cb', 'fca025d3b60f')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
