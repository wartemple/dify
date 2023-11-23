"""merging two heads

Revision ID: 4616619f6209
Revises: 2e9819ca5b28, 69b0b93484cb
Create Date: 2023-10-12 16:46:56.961478

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4616619f6209'
down_revision = ('2e9819ca5b28', '69b0b93484cb')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
