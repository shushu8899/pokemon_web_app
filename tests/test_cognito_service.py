import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from unittest.mock import MagicMock, patch
from app.services.cognito_service import CognitoService
from botocore.exceptions import ClientError
from app.exceptions import ServiceException

# Mocking the boto3 client
@pytest.fixture
def cognito_service_mock():
    with patch("boto3.client") as mock_client:
        mock_cognito = MagicMock()
        mock_client.return_value = mock_cognito
        yield mock_cognito  # Provide the mocked Cognito client

def test_register_user(cognito_service_mock):
    # 1) Arrange
    cognito_service = CognitoService()
    mock_response = {
        'UserSub': '12345',
        'UserConfirmed': False
    }
    cognito_service_mock.sign_up.return_value = mock_response

    # 2) Act
    response = cognito_service.register_user('test@example.com', 'Password123!')

    # 3) Assert
    assert response["UserSub"] == '12345'
    assert response["UserConfirmed"] is False
    cognito_service_mock.sign_up.assert_called_once_with(
        ClientId=cognito_service.client_id,
        SecretHash=cognito_service.calculate_secret_hash('test@example.com'),
        Username='test@example.com',
        Password='Password123!',
        UserAttributes=[{'Name': 'email', 'Value': 'test@example.com'}]
    )

def test_authenticate_user_success(cognito_service_mock):
    # 1) Arrange
    cognito_service = CognitoService()
    mock_response = {
        'AuthenticationResult': {
            'IdToken': 'id_token_example',
            'AccessToken': 'access_token_example',
            'RefreshToken': 'refresh_token_example'
        }
    }
    cognito_service_mock.initiate_auth.return_value = mock_response

    # 2) Act
    response = cognito_service.authenticate_user('test@example.com', 'Password123!')

    # 3) Assert
    assert 'id_token' in response
    assert 'access_token' in response
    assert 'refresh_token' in response
    cognito_service_mock.initiate_auth.assert_called_once_with(
        AuthFlow="USER_PASSWORD_AUTH",
        AuthParameters={
            "USERNAME": 'test@example.com',
            "PASSWORD": 'Password123!',
            "SECRET_HASH": cognito_service.calculate_secret_hash('test@example.com')
        },
        ClientId=cognito_service.client_id
    )

def test_authenticate_user_user_not_confirmed(cognito_service_mock):
    # 1) Arrange
    cognito_service = CognitoService()

    # Mocking the side effect to raise UserNotConfirmedException
    cognito_service_mock.initiate_auth.side_effect = ClientError(
        {"Error": {"Code": "UserNotConfirmedException", "Message": "User account not confirmed."}},
        "initiate_auth"
    )

    # 2) Act & 3) Assert
    with pytest.raises(ServiceException) as exc_info:
        cognito_service.authenticate_user('test@example.com', 'Password123!')

    # Assert the exception details
    assert exc_info.value.status_code == 403
    assert str(exc_info.value) == "User account not confirmed."

def test_authenticate_user_not_authorized(cognito_service_mock):
    # 1) Arrange
    cognito_service = CognitoService()

    # Mocking the side effect to raise NotAuthorizedException
    cognito_service_mock.initiate_auth.side_effect = ClientError(
        {"Error": {"Code": "NotAuthorizedException", "Message": "Invalid email or password."}},
        "initiate_auth"
    )

    # 2) Act & 3) Assert
    with pytest.raises(ServiceException) as exc_info:
        cognito_service.authenticate_user('invalid@example.com', 'WrongPassword!')

    # Assert the exception details
    assert exc_info.value.status_code == 401
    assert str(exc_info.value) == "Invalid email or password."


def test_confirm_user(cognito_service_mock):
    # 1) Arrange
    cognito_service = CognitoService()
    cognito_service_mock.confirm_sign_up.return_value = {}
    cognito_service_mock.admin_add_user_to_group.return_value = {}

    # 2) Act
    response = cognito_service.confirm_user('test@example.com', 'confirmation_code')

    # 3) Assert
    assert response == "User confirmed successfully and added to Users group."
    cognito_service_mock.confirm_sign_up.assert_called_once_with(
        ClientId=cognito_service.client_id,
        Username='test@example.com',
        ConfirmationCode='confirmation_code',
        SecretHash=cognito_service.calculate_secret_hash('test@example.com')
    )
    cognito_service_mock.admin_add_user_to_group.assert_called_once_with(
        UserPoolId=cognito_service.user_pool_id,
        Username='test@example.com',
        GroupName='Users'  # based on email domain logic
    )

def test_resend_confirmation_code(cognito_service_mock):
    # 1) Arrange
    cognito_service = CognitoService()
    cognito_service_mock.resend_confirmation_code.return_value = {}

    # 2) Act
    response = cognito_service.resend_confirmation_code('test@example.com')

    # 3) Assert
    assert response == "Confirmation code resent successfully."
    cognito_service_mock.resend_confirmation_code.assert_called_once_with(
        ClientId=cognito_service.client_id,
        Username='test@example.com',
        SecretHash=cognito_service.calculate_secret_hash('test@example.com')
    )