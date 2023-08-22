# -*- coding:utf-8 -*-
import flask
import flask_login
from flask import request, current_app
from flask_restful import Resource, reqparse

import services
from controllers.console import api
from controllers.console.error import AccountNotLinkTenantError
from controllers.console.setup import setup_required
from libs.helper import email
from libs.password import valid_password
from services.account_service import AccountService, TenantService, RegisterService
from models.account import Account
from extensions.ext_database import db
from core.model_providers.models.entity.model_params import ModelType
from core.model_providers.model_factory import ModelFactory

class RegisterApi(Resource):
    """Resource for user login."""

    @setup_required
    def post(self):
        """Authenticate user and login."""
        parser = reqparse.RequestParser()
        parser.add_argument('email', type=email, required=True, location='json')
        parser.add_argument('password', type=valid_password, required=True, location='json')
        parser.add_argument('name', location='json', default='dify_user')
        args = parser.parse_args()

        # todo: Verify the recaptcha
        account = Account.query.filter_by(email=args['email']).first()
        if not account:
            # Create account
            account = RegisterService.register(
                email=args['email'],
                name=args['name'],
                password=args['password'],
            )
            account.interface_language = 'zh-Hans'
            db.session.commit()
        # TODO: 为用户添加默认的glm引擎
        # http://172.17.6.32:7777/api/v1/chatglm/message
        return {'result': 'success'}



class LoginApi(Resource):
    """Resource for user login."""

    @setup_required
    def post(self):
        """Authenticate user and login."""
        parser = reqparse.RequestParser()
        parser.add_argument('email', type=email, required=True, location='json')
        parser.add_argument('password', type=valid_password, required=True, location='json')
        parser.add_argument('remember_me', type=bool, required=False, default=False, location='json')
        args = parser.parse_args()

        # todo: Verify the recaptcha

        try:
            account = AccountService.authenticate(args['email'], args['password'])
        except services.errors.account.AccountLoginError:
            return {'code': 'unauthorized', 'message': 'Invalid email or password'}, 401

        try:
            TenantService.switch_tenant(account)
        except Exception:
            pass

        flask_login.login_user(account, remember=args['remember_me'])
        AccountService.update_last_login(account, request)

        # todo: return the user info

        return {'result': 'success'}


class LogoutApi(Resource):

    @setup_required
    def get(self):
        flask.session.pop('workspace_id', None)
        flask_login.logout_user()
        return {'result': 'success'}


class ResetPasswordApi(Resource):
    @setup_required
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('email', type=email, required=True, location='json')
        args = parser.parse_args()

        # import mailchimp_transactional as MailchimpTransactional
        # from mailchimp_transactional.api_client import ApiClientError

        account = {'email': args['email']}
        # account = AccountService.get_by_email(args['email'])
        # if account is None:
        #     raise ValueError('Email not found')
        # new_password = AccountService.generate_password()
        # AccountService.update_password(account, new_password)

        # todo: Send email
        MAILCHIMP_API_KEY = current_app.config['MAILCHIMP_TRANSACTIONAL_API_KEY']
        # mailchimp = MailchimpTransactional(MAILCHIMP_API_KEY)

        message = {
            'from_email': 'noreply@example.com',
            'to': [{'email': account.email}],
            'subject': 'Reset your Dify password',
            'html': """
                <p>Dear User,</p>
                <p>The Dify team has generated a new password for you, details as follows:</p> 
                <p><strong>{new_password}</strong></p>
                <p>Please change your password to log in as soon as possible.</p>
                <p>Regards,</p>
                <p>The Dify Team</p> 
            """
        }

        # response = mailchimp.messages.send({
        #     'message': message,
        #     # required for transactional email
        #     ' settings': {
        #         'sandbox_mode': current_app.config['MAILCHIMP_SANDBOX_MODE'],
        #     },
        # })

        # Check if MSG was sent
        # if response.status_code != 200:
        #     # handle error
        #     pass

        return {'result': 'success'}


api.add_resource(LoginApi, '/login')
api.add_resource(LogoutApi, '/logout')
api.add_resource(RegisterApi, '/register')