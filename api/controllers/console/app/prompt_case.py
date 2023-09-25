# -*- coding:utf-8 -*-
import json

from flask import request
from flask_login import current_user
from flask_restful import Resource, reqparse, fields, marshal_with
from controllers.console import api
from controllers.console.app import _get_app
from controllers.console.setup import setup_required
from controllers.console.wraps import account_initialization_required
from core.login.login import login_required
from events.app_event import app_model_config_was_updated
from extensions.ext_database import db
from models.model import AppPromptCases
from services.app_model_config_service import AppModelConfigService
from controllers.console import api
from werkzeug.exceptions import Forbidden

app_detail_fields = {
    'id': fields.String,
    'content': fields.Raw(attribute='prompt_content'),
    'app_id': fields.String,
    'is_like': fields.Boolean,
}

class PromptCase(Resource):

    @setup_required
    @login_required
    @account_initialization_required
    @marshal_with(app_detail_fields)
    def post(self, app_id):
        """Modify app model config"""
        app_id = str(app_id)

        app_model = _get_app(app_id)
        prompt_content = request.json.get('content')

        prompt_case = AppPromptCases(
            app_id=app_model.id,
            prompt_content=prompt_content,
            is_like=False
        )
        db.session.add(prompt_case)
        db.session.commit()

        return prompt_case, 201
    
    

class PromptCaseDetailApi(Resource):

    @setup_required
    @login_required
    @account_initialization_required
    def delete(self, app_id, prompt_id):
        """Delete app"""
        prompt_case = db.session.query(AppPromptCases).filter(AppPromptCases.id == str(prompt_id)).first()

        db.session.delete(prompt_case)
        db.session.commit()

        return {'result': 'success'}, 204
    
    @setup_required
    @login_required
    @account_initialization_required
    def patch(self, app_id, prompt_id):
        """Delete app"""
        prompt_case = db.session.query(AppPromptCases).filter(AppPromptCases.id == str(prompt_id)).first()
        prompt_case.prompt_content = request.json.get('content')
        db.session.add(prompt_case)
        db.session.commit()

        return {'result': 'success'}, 200

class PromptCaseLikeApi(Resource):

    @setup_required
    @login_required
    @account_initialization_required
    def get(self, app_id, prompt_id):
        """Delete app"""
        prompt_case = db.session.query(AppPromptCases).filter(AppPromptCases.id == str(prompt_id)).first()
        prompt_case.load_prompt_to_model_config()

        return {'result': 'success'}


api.add_resource(PromptCase, '/apps/<uuid:app_id>/prompt-cases')
api.add_resource(PromptCaseDetailApi, '/apps/<uuid:app_id>/prompt-cases/<uuid:prompt_id>')
api.add_resource(PromptCaseLikeApi, '/apps/<uuid:app_id>/prompt-cases/<uuid:prompt_id>/like')
