import { ICredentialType, INodeProperties, ICredentialTestRequest, Icon } from 'n8n-workflow';

export class MailerLiteCustomApi implements ICredentialType {
    name = 'mailerLiteCustomApi';
    displayName = 'MailerLite API';
    documentationUrl = 'https://developers.mailerlite.com/docs/';
    icon: Icon = 'file:mailerlite.svg';
    properties: INodeProperties[] = [
        {
            displayName: 'API Key',
            name: 'apiKey',
            type: 'string',
            typeOptions: {
                password: true,
            },
            default: '',
            required: true,
        },
    ];
    test: ICredentialTestRequest = {
        request: {
            baseURL: 'https://connect.mailerlite.com/api',
            url: '/subscribers',
            method: 'GET',
        },
    };
}
