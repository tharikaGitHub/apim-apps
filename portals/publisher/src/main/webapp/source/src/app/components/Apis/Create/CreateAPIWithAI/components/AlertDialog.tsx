/* eslint-disable */
/*
 * Copyright (c) 2025, WSO2 LLC. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
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
import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import LinearProgress from '@mui/material/LinearProgress';
import { useHistory } from 'react-router-dom';
import { useIntl } from 'react-intl';
import Alert from 'AppComponents/Shared/Alert';
import YAML from 'js-yaml';
import API from 'AppData/api';

interface AlertDialogProps {
  sessionId: string;
  spec: string;
  apiType: string;
}

const AlertDialog: React.FC<AlertDialogProps> = ({ sessionId, spec, apiType }) => {
  const [open, setOpen] = React.useState(false);
  const [showProgress, setShowProgress] = React.useState(false);
  const intl = useIntl();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const history = useHistory();

    /**
   * Method to handle error scenarios
   * 
   * @param messageId messageId
   * @param defaultMessage defaultMessage
   */
    const handleError = (messageId: string, defaultMessage: string) => {
      Alert.error(intl.formatMessage({ id: messageId, defaultMessage }));
      throw new Error(defaultMessage);
    };

  /**
   * Validate the provided GraphQL schema as a file
   * 
   * @param definition API definition for graphql API returned from LLM
   * @returns validation response object
   */
  async function validateGraphQLSchema(definition: any) { 
    try {
      const response = await API.validateGraphQLFile(definition);
      if (response != null) {
        return response.obj;
      }
      throw new Error("Invalid response received while validating GraphQL schema");
    } catch (error) {
        console.error("Error validating the GraphQL schema: ", error);
        throw error;
    }
  }

  /**
   * Validate the provided OpenAPI definition as a file
   * 
   * @param definition API definition for REST API returned from LLM
   * @returns validation response object
   */
  async function validateOpenAPIDefinition(definition: any) { 
    try {
      const response = await API.validateOpenAPIByFile(definition);
      if (response != null) {
        return response.obj;
      }
      throw new Error("Invalid response received while validating OpenAPI definition");
    } catch (error) {
        console.error("Error validating the OpenAPI definition: ", error);
        throw error;
    }
  }

  /**
   * Validate the provided AsyncAPI definition as a file
   * 
   * @param definition API definition for AsyncAPI returned from LLM
   * @returns validation response object
   */
  async function validateAsyncAPIDefinition(definition: any) { 
    try {
      const response = await API.validateAsyncAPIByFile(definition);
      if (response != null) {
        return response.obj;
      }
      throw new Error("Invalid response received while validating AsyncAPI definition");
    } catch (error) {
        console.error("Error validating the AsyncAPI definition: ", error);
        throw error;
    }
  }

  /**
   * Method used to create a file object of the API definitions
   * 
   * @param spec The API spec
   * @param type The content type
   * @returns 
   */
  const createBlobAndFile = (spec: string, type: string) => {
    const blob = new Blob([spec], { type });
    return new File([blob], `apiDefinition.${type === 'text/plain' ? 'graphql' : 'yaml'}`, { type: `${type};charset=utf-8` });
  };

  /**
   * Handles redirecting the user to create an API
   * @returns if an error occurs
   */
  const handleCreate = async () => {

    handleClose();
    setShowProgress(true);

    try {
      
      let endpointValue = (apiType === 'WebSocket' ? 'ws://localhost:9099' : 'http://localhost:8080');
      let apiName = (apiType === 'REST' ? 'Banking Transaction API' : 'Live Streaming API');

      const createData = (type: string, file: File, graphQLInfo?: any) => ({
        name: apiName,
        version: '1.0.0',
        context: '/apicontext',
        gatewayType: 'wso2/synapse',
        gatewayVendor: 'wso2',
        endpoint: endpointValue,
        protocol: type,
        asyncTransportProtocols: type,
        source: 'DesignAssistant',
        file,
        graphQLInfo
      });

      let validationResponse: any;
      let definition: File;
      let graphQLInfo: any;
  
      if (apiType === 'REST') {
        YAML.load(spec);
        definition = createBlobAndFile(spec, 'text/yaml');
        validationResponse = await validateOpenAPIDefinition(definition);
  
        if (!validationResponse?.isValid) {
          handleError('CreateAPIWithAI.components.AlertDialog.error.create.http.API', 'The provided OpenAPI definition is invalid. Please try again.');
        }
        const data = createData(apiType, definition);
        history.push('/apis/create/openapi', data);
      } else if (['SSE', 'WebSocket', 'WebSub'].includes(apiType)) {
        YAML.load(spec);
        definition = createBlobAndFile(spec, 'text/yaml');
        validationResponse = await validateAsyncAPIDefinition(definition);
  
        if (!validationResponse?.isValid) {
          handleError('CreateAPIWithAI.components.AlertDialog.error.create.async.API', 'The provided AsyncAPI definition is invalid. Please try again.');
        }
        const data = createData(apiType, definition);
        history.push('/apis/create/asyncapi', data);
      } else if (apiType === 'GraphQL') {
        definition = createBlobAndFile(spec, 'text/plain');
        validationResponse = await validateGraphQLSchema(definition);
  
        if (validationResponse?.isValid) {
          graphQLInfo = validationResponse.graphQLInfo;
          const data = createData(apiType, definition, graphQLInfo);
          history.push('/apis/create/graphQL', data);
        } else {
          handleError('CreateAPIWithAI.components.AlertDialog.error.create.graphql.API', 'The provided GraphQL schema is invalid. Please try again.');
        }
      } 
      setShowProgress(false);
    } catch (error) {
      setShowProgress(false);
      console.error('Error during API creation:', error);
      Alert.error(intl.formatMessage({ id: 'CreateAPIWithAI.components.AlertDialog.error.create.API', defaultMessage: 'Error Creating API' }));
      throw error;
    }
  };

  return (
    <React.Fragment>
      <Button
        variant="outlined"
        onClick={handleClickOpen}
        sx={{ backgroundColor: '#FFF' }}
      >
        Create API
      </Button>
      
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Create API"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Confirm creation of API in the Publisher Portal.
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>
            CANCEL
          </Button>
          <Button
            onClick={handleCreate}
            sx={{
              border: '1px solid #1C7EA7'
            }}
            autoFocus
          >
            CREATE
          </Button>
        </DialogActions>
      </Dialog>

      {showProgress && (
        <Dialog 
          open={showProgress} 
          aria-labelledby="progress-dialog-title" 
          sx={{ 
            '.MuiDialog-paper': { 
              padding: '33px 55px',
            } 
          }}
        >
          <DialogTitle id="progress-dialog-title" sx={{ textAlign: 'center' }}>
            API Creation in Progress
          </DialogTitle>
          <DialogContent>
            <LinearProgress
              sx={{ 
                width: '100%',
                height: '6px'
              }} 
            />
          </DialogContent>
        </Dialog>
      )}
    </React.Fragment>
  );
};

export default AlertDialog;