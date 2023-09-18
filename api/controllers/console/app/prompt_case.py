# -*- coding:utf-8 -*-
import json

from flask import request
from flask_restful import Resource
from flask_login import current_user

from controllers.console import api
from controllers.console.app import _get_app
from controllers.console.setup import setup_required
from controllers.console.wraps import account_initialization_required
from core.login.login import login_required
from events.app_event import app_model_config_was_updated
from extensions.ext_database import db
from models.model import AppPromptCases
from services.app_model_config_service import AppModelConfigService


class ModelConfigResource(Resource):

    @setup_required
    @login_required
    @account_initialization_required
    def post(self, app_id):
        """Modify app model config"""
        app_id = str(app_id)

        app_model = _get_app(app_id)
        prompt_content = request.json.get('prompt_content')

        prompt_case = AppPromptCases(
            app_id=app_model.id,
            prompt_content=prompt_content,
            is_like=False
        )
        db.session.add(prompt_case)
        db.session.commit()

        return {'result': 'success'}


api.add_resource(ModelConfigResource, '/apps/<uuid:app_id>/prompt-case')
