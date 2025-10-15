import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    IHttpRequestOptions,
    ILoadOptionsFunctions,
    INodePropertyOptions,
    NodeApiError,
} from 'n8n-workflow';

interface MailerLiteGroup {
    id: string;
    name: string;
}

export class MailerLiteCustom implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'MailerLite Custom',
        name: 'mailerLiteCustom',
        icon: 'file:mailerlite.svg',
        group: ['transform'],
        version: 1,
        description: 'Fetch groups and add subscribers to MailerLite',
        defaults: {
            name: 'MailerLite Custom',
        },
        inputs: ['main'],
        outputs: ['main'],
        usableAsTool: true,
        credentials: [
            {
                name: 'mailerLiteCustomApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                options: [
                    {
                        name: 'Get Groups',
                        value: 'getGroups',
                        description: 'Fetch list of groups',
                        action: 'Fetch list of groups',
                    },
                    {
                        name: 'Add Subscriber to Group',
                        value: 'addSubscriber',
                        description: 'Add a user to a group',
                        action: 'Add a user to a group',
                    },
                ],
                default: 'getGroups',
            },

            // --- Group selection ---
            {
                displayName: 'Group Name or ID',
                name: 'groupId',
                type: 'options',
                typeOptions: {
                    loadOptionsMethod: 'getGroups',
                },
                displayOptions: {
                    show: {
                        operation: ['addSubscriber'],
                    },
                },
                default: '',
                description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
            },

            // --- Email field ---
            {
                displayName: 'Email',
                name: 'email',
                type: 'string',
                default: '',
                required: true,
                placeholder: 'name@email.com',
                displayOptions: {
                    show: {
                        operation: ['addSubscriber'],
                    },
                },
            },
        ],
    };

    // --- Dynamically load groups into dropdown ---
    methods = {
        loadOptions: {
            async getGroups(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
                const credentials = await this.getCredentials('mailerLiteCustomApi');

                const options: IHttpRequestOptions = {
                    method: 'GET',
                    url: 'https://connect.mailerlite.com/api/groups',
                    headers: {
                        Authorization: `Bearer ${credentials.apiKey}`,
                        Accept: 'application/json',
                    },
                    json: true,
                };

                const responseData = await this.helpers.httpRequest(options);
                return responseData.data.map((group: MailerLiteGroup) => ({
                    name: group.name,
                    value: group.id,
                }));
            },
        },
    };

    // --- Execution Logic ---
    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];
        const credentials = await this.getCredentials('mailerLiteCustomApi');

        for (let i = 0; i < items.length; i++) {
            const operation = this.getNodeParameter('operation', i) as string;

            let responseData;
            try {
                if (operation === 'getGroups') {
                    const options: IHttpRequestOptions = {
                        method: 'GET',
                        url: 'https://connect.mailerlite.com/api/groups',
                        headers: {
                            Authorization: `Bearer ${credentials.apiKey}`,
                            Accept: 'application/json',
                        },
                        json: true,
                    };
                    responseData = await this.helpers.httpRequest(options);
                }

                if (operation === 'addSubscriber') {
                    const groupId = this.getNodeParameter('groupId', i) as string;
                    const email = this.getNodeParameter('email', i) as string;

                    const options: IHttpRequestOptions = {
                        method: 'POST',
                        url: `https://connect.mailerlite.com/api/groups/${groupId}/subscribers`,
                        headers: {
                            Authorization: `Bearer ${credentials.apiKey}`,
                            Accept: 'application/json',
                            'Content-Type': 'application/json',
                        },
                        body: {
                            email,
                        },
                        json: true,
                    };

                    responseData = await this.helpers.httpRequest(options);
                }
            } catch (error) {
                throw new NodeApiError(this.getNode(), error);
            }

            returnData.push({ json: responseData });
        }

        return [returnData];
    }
}
