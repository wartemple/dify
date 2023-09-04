# -*- coding:utf-8 -*-
from functools import wraps

from flask import request, current_app
from flask_login import login_required, current_user, login_user
from flask_restful import Resource, reqparse
from models.account import *
from extensions.ext_database import db
from models.model import DifySetup
from services.account_service import AccountService, TenantService, RegisterService

from libs.helper import email, str_len
from libs.password import valid_password

from . import api
from .error import AlreadySetupError, NotSetupError
from .wraps import only_edition_self_hosted


class SetupApi(Resource):

    def get(self):
        if current_app.config['EDITION'] == 'SELF_HOSTED':
            setup_status = get_setup_status()
            if setup_status:
                return {
                    'step': 'finished',
                    'setup_at': setup_status.setup_at.isoformat()
                }
            return {'step': 'not_start'}
        return {'step': 'finished'}

    @only_edition_self_hosted
    def post(self):
        # is set up
        if get_setup_status():
            raise AlreadySetupError()

        # is tenant created
        tenant_count = TenantService.get_tenant_count()
        if tenant_count > 0:
            raise AlreadySetupError()

        parser = reqparse.RequestParser()
        parser.add_argument('email', type=email,
                            required=True, location='json')
        parser.add_argument('name', type=str_len(
            30), required=True, location='json')
        parser.add_argument('password', type=valid_password,
                            required=True, location='json')
        args = parser.parse_args()

        # Register
        account = RegisterService.register(
            email=args['email'],
            name=args['name'],
            password=args['password']
        )

        setup()

        # Login
        login_user(account)
        AccountService.update_last_login(account, request)

        return {'result': 'success'}, 201


def setup():
    dify_setup = DifySetup(
        version=current_app.config['CURRENT_VERSION']
    )
    db.session.add(dify_setup)



class UserRegisterUtils:
    # SECOND
    # 网关进行统一认证登录，不再使用平台内部的登录认证系统
    def _init_engine(self, account):
        import os

        from core.model_providers.providers.base import CredentialsValidateFailedError
        from services.provider_service import ProviderService

        tenant_account_join = TenantAccountJoin.query.filter_by(account_id=account.id).first()
        account.current_tenant_id = tenant_account_join.tenant_id
        provider_service = ProviderService()
        engines = [
            {"provider_name": "chatglm", "config": {"api_base": os.getenv('ChatGLM_URL', 'http://172.17.6.32:7777/api/v1/chatglm/message')}},
            {"provider_name": "baichuan", "config": {"api_base": os.getenv('BAICHUAN_URL', 'http://172.17.6.32:7777/api/v1/baichuan/message')}}
            {"provider_name": "openai", "config": {"openai_api_base": "", "openai_api_key": "test", "openai_organization": ""}},
        ]
        for engine in engines:
            try:
                provider_service.save_custom_provider_config(
                    tenant_id=account.current_tenant_id,
                    provider_name=engine['provider_name'],
                    config=engine['config']
                )
            except CredentialsValidateFailedError as ex:
                raise ValueError(str(ex))

    def _get_email(self, ):
        return request.headers.get('email')
    
    def _get_username(self, ):
        return request.headers.get('username', '')

    def register(self):
        email = self._get_email()
        # 没登录用户 或者传输的header不一致时，进行用户注册或者登录
        if not current_user or current_app.email != email:
            self.login_user()

    def login_user(self, ):
        email = self._get_email()
        username = self._get_username()
        account = Account.query.filter_by(email=email).first()
        # 注册用户
        if not account:
            account = RegisterService.register(email=email, name=username, password='P@ssw0rd')
            account.interface_language = 'zh-Hans'
            db.session.commit()
            self._init_engine(account)
        # 登录用户
        try:
            TenantService.switch_tenant(account)
        except Exception:
            pass

        login_user(account, remember=False)
        AccountService.update_last_login(account, request)
    

def setup_required(view):
    @wraps(view)
    def decorated(*args, **kwargs):
        # SECOND
        register_utils = UserRegisterUtils()
        register_utils.register()
        # check setup
        if not get_setup_status():
            raise NotSetupError()

        return view(*args, **kwargs)

    return decorated


def get_setup_status():
    if current_app.config['EDITION'] == 'SELF_HOSTED':
        return DifySetup.query.first()
    else:
        return True

api.add_resource(SetupApi, '/setup')
