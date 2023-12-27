"""merging three heads

Revision ID: eab59cc1ad3d
Revises: 88072f0caa04, cb4b1c7b8463
Create Date: 2023-12-27 06:10:09.828554

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'eab59cc1ad3d'
down_revision = ('88072f0caa04', 'cb4b1c7b8463')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
