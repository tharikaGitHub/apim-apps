/* eslint-disable no-unreachable */
/*
 * Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { useContext, useState } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CloudDownloadRounded from '@mui/icons-material/CloudDownloadRounded';
import Tooltip from '@mui/material/Tooltip';
import API from 'AppData/api';
import Utils from 'AppData/Utils';
import Alert from 'AppComponents/Shared/Alert';
import { FormattedMessage, useIntl } from 'react-intl';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import Settings from 'Settings';
import queryString from 'query-string';
import { ApiContext } from './ApiContext';

/**
 * Renders the download links.
 * @returns {JSX} rendered output
 */
function SourceDownload(props) {
    const { selectedEndpoint } = props;
    const { api } = useContext(ApiContext);
    const apiClient = new API();
    const intl = useIntl();
    const accessTokenPart = Utils.getCookieWithoutEnvironment('WSO2_AM_TOKEN_1_Default');
    const [isTokenCopied, setIsTokenCopied] = useState(false);

    const { location } = window;

    const { app: { customUrl: { tenantDomain: customUrlEnabledDomain } } } = Settings;
    let tenantDomain = '';
    if (customUrlEnabledDomain !== 'null') {
        tenantDomain = customUrlEnabledDomain;
    } else if (location) {
        const { tenant } = queryString.parse(location.search);
        if (tenant) {
            tenantDomain = tenant;
        }
    }
    const tenant = tenantDomain;
    /**
     * Downloads the WSDL of the api for the provided environment
     *
     * @param {EventListener} e element click event
     */
    const downloadWSDL = (e) => {
        e.preventDefault();
        const wsdlClient = apiClient.getWsdlClient();
        const promisedGet = wsdlClient.downloadWSDLForEnvironment(api.id, selectedEndpoint.environmentName);
        promisedGet
            .then((done) => {
                Utils.downloadFile(done);
            })
            .catch((error) => {
                if (process.env.NODE_ENV !== 'production') {
                    console.log(error);
                    Alert.error(intl.formatMessage({
                        id: 'Apis.Details.Environments.download.wsdl.error',
                        defaultMessage: 'Error downloading the WSDL',
                    }));
                }
            });
    };

    const downloadGraphQLSchema = (e) => {
        e.preventDefault();
        const promisedGraphQL = apiClient.getGraphQLSchemaByAPIId(api.id);
        promisedGraphQL.then((response) => {
            const fileName = api.provider + '-' + api.name + '-' + api.version + '.graphql';
            Utils.downloadFile(response, fileName);
        })
            .catch((error) => {
                if (process.env.NODE_ENV !== 'production') {
                    console.log(error);
                    Alert.error(intl.formatMessage({
                        id: 'Apis.Details.Environments.download.graphql.error',
                        defaultMessage: 'Error downloading the GraphQL Schema',
                    }));
                }
            });
    };

    /**
     * Downloads the swagger of the api for the provided environment
     *
     * @param {string} apiId uuid of the API
     * @param {string} environment name of the environment
     */
    const downloadSwagger = (e) => {
        e.preventDefault();
        let promiseSwagger;

        if (selectedEndpoint.environmentName) {
            promiseSwagger = apiClient.getSwaggerByAPIIdAndEnvironment(api.id, selectedEndpoint.environmentName);
        } else {
            promiseSwagger = apiClient.getSwaggerByAPIId(api.id);
        }
        promiseSwagger.then((done) => {
            Utils.downloadFile(done);
        }).catch((error) => {
            console.log(error);
            Alert.error(intl.formatMessage({
                id: 'Apis.Details.Environments.download.swagger.error',
                defaultMessage: 'Error downloading the Swagger',
            }));
        });
    };

    /**
     * Downloads the asyncapi specification of the api for the provided environment
     *
     * @param {string} apiId uuid of the API
     * @param {string} environment name of the environment
     */
    const downloadAsync = (e) => {
        e.preventDefault();
        const promiseAsync = apiClient.getAsyncApiSpecificationByAPIIdAndEnvironment(api.id, selectedEndpoint.environmentName);
        promiseAsync
            .then((done) => {
                Utils.downloadFile(done);
            })
            .catch((error) => {
                console.error(error);
                Alert.error(intl.formatMessage({
                    id: 'Apis.Details.Environments.download.asyncapi.error',
                    defaultMessage: 'Error downloading the AsyncAPI Specification',
                }));
            });
    };

    if (
        api.type === 'SOAP') {
        return (
            <Tooltip
                title={(
                    <FormattedMessage
                        id='Apis.Details.Environments.download.wsdl'
                        defaultMessage='WSDL'
                    />
                )}
                placement='right'
                sx={{
                    cursor: 'pointer',
                    margin: '-10px 0',
                    padding: '0 0 0 5px',
                    '& .material-icons': (theme) => ({
                        fontSize: 18,
                        color: theme.palette.secondary.main,
                    }),
                }}
            >
                <a
                    onKeyDown={downloadWSDL}
                    onClick={downloadWSDL}
                    className={(theme) => ({
                        fontSize: 14,
                        color: theme.palette.primary.main,
                        display: 'flex',
                    })}
                >
                    <CloudDownloadRounded sx={{
                        marginRight: 1,
                    }}
                    />
                    <FormattedMessage
                        id='Apis.Details.Environments.download.wsdl.text'
                        defaultMessage='Download WSDL'
                    />
                </a>
            </Tooltip>
        );
    }
    if (api.type === 'HTTP' || api.type === 'SOAPTOREST') {
        return (
            <Box display='flex' alignItems='center'>
                <Tooltip
                    title={(
                        <FormattedMessage
                            id='Apis.Details.Environments.download.swagger'
                            defaultMessage='Swagger'
                        />
                    )}
                    placement='right'
                    sx={(theme) => ({
                        cursor: 'pointer',
                        margin: '-10px 0',
                        padding: '0 0 0 5px',
                        '& .material-icons': {
                            fontSize: 18,
                            color: theme.palette.secondary.main,
                        },
                    })}
                >
                    <a
                        onClick={downloadSwagger}
                        onKeyDown={downloadSwagger}
                        className={(theme) => ({
                            fontSize: 14,
                            color: theme.palette.primary.main,
                            display: 'flex',
                        })}
                        id='swagger-download-btn'
                    >
                        <CloudDownloadRounded sx={{
                            marginRight: 1,
                        }}
                        />
                        <FormattedMessage
                            id='Apis.Details.Environments.download.swagger.text'
                            defaultMessage='Download Swagger'
                        />
                    </a>
                </Tooltip>
                <Tooltip
                    title={isTokenCopied
                        ? (
                            <FormattedMessage
                                id='Apis.Details.Swagger.URL.copied'
                                defaultMessage='Copied'
                            />
                        )
                        : (
                            <FormattedMessage
                                id='Apis.Details.Swagger.URL.copy.to.clipboard'
                                defaultMessage='Copy to clipboard'
                            />
                        )}
                    placement='top'
                >
                    <Button
                        aria-label='Copy to clipboard'
                        size='small'
                        color='grey'
                        onClick={() => {
                            navigator.clipboard.writeText(location.origin + '/api/am/devportal/v3/apis/' + api.id
                            + '/swagger?accessToken=' + accessTokenPart + '&X-WSO2-Tenant-Q='
                            + tenant + '&environmentName='
                            + selectedEndpoint.environmentName).then(() => setIsTokenCopied('urlCopied'));
                        }}
                    >
                        <FileCopyIcon sx={{
                            marginRight: 1,
                        }}
                        />
                    </Button>
                </Tooltip>
            </Box>
        );
    }
    if (api.type === 'WS' || api.type === 'WEBSUB' || api.type === 'SSE' || api.type === 'ASYNC') {
        return (
            <Tooltip
                title={(
                    <FormattedMessage
                        id='Apis.Details.Environments.download.asyncapi'
                        defaultMessage='AsyncAPI Specification'
                    />
                )}
                placement='right'
                sx={(theme) => ({
                    cursor: 'pointer',
                    margin: '-10px 0',
                    padding: '0 0 0 5px',
                    '& .material-icons': {
                        fontSize: 18,
                        color: theme.palette.secondary.main,
                    },
                })}
            >
                <a
                    onKeyDown={downloadAsync}
                    onClick={downloadAsync}
                    className={(theme) => ({
                        fontSize: 14,
                        color: theme.palette.primary.main,
                        display: 'flex',
                    })}
                    id='swagger-download-btn'
                >
                    <CloudDownloadRounded sx={{
                        marginRight: 1,
                    }}
                    />
                    <FormattedMessage
                        id='Apis.Details.Environments.download.asyncapi.text'
                        defaultMessage='Download AsyncAPI Specification'
                    />
                </a>
            </Tooltip>
        );
    }
    if (api.type === 'GRAPHQL') {
        return (
            <Tooltip
                title={(
                    <FormattedMessage
                        id='Apis.Details.Environments.download.graphQL'
                        defaultMessage='GraphQL'
                    />
                )}
                placement='right'
                sx={(theme) => ({
                    cursor: 'pointer',
                    margin: '-10px 0',
                    padding: '0 0 0 5px',
                    '& .material-icons': {
                        fontSize: 18,
                        color: theme.palette.secondary.main,
                    },
                })}
            >
                <a
                    onKeyDown={downloadGraphQLSchema}
                    onClick={downloadGraphQLSchema}
                    className={(theme) => ({
                        fontSize: 14,
                        color: theme.palette.primary.main,
                        display: 'flex',
                    })}
                >
                    <CloudDownloadRounded sx={{
                        marginRight: 1,
                    }}
                    />
                    <FormattedMessage
                        id='Apis.Details.Environments.download.graphql.text'
                        defaultMessage='Download GraphQL'
                    />
                </a>
            </Tooltip>
        );
    }
}

export default SourceDownload;
