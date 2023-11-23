"""merging two heads2

Revision ID: cb4b1c7b8463
Revises: 4616619f6209, fca025d3b60f
Create Date: 2023-11-22 09:41:20.031984

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'cb4b1c7b8463'
down_revision = ('4616619f6209', 'fca025d3b60f')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
