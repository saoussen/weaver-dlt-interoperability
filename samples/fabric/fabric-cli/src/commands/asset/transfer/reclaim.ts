/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { GluegunCommand } from 'gluegun'
import * as path from 'path'
import {
    commandHelp,
    pledgeAsset,
    getNetworkConfig,
    getLocalAssetPledgeDetails,
    getChaincodeConfig,
    handlePromise,
    generateViewAddressFromRemoteConfig,
    interopHelper
} from '../../../helpers/helpers'
import {
    fabricHelper,
    getUserCertBase64
} from '../../../helpers/fabric-functions'

import logger from '../../../helpers/logger'
import * as dotenv from 'dotenv'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

const delay = ms => new Promise(res => setTimeout(res, ms))

const command: GluegunCommand = {
  name: 'reclaim',
  description:
    'Reclaims pledged asset in source network',
  run: async toolbox => {
    const {
      print,
      parameters: { options, array }
    } = toolbox
    if (options.help || options.h) {
      commandHelp(
        print,
        toolbox,
        'fabric-cli asset transfer reclaim --source-network=network1 --user=alice --type=bond --pledge-id="pledgeid" --param=bond01:a03\r\nfabric-cli asset transfer reclaim --source-network=network1 --user=alice --type=token --param=token1:50',
        'fabric-cli asset transfer reclaim --source-network=<source-network-name> --user=<user-id> --type=<bond|token> --pledge-id=<pledge-id> --param=<asset-type>:<asset-id|num-units>',
        [
          {
            name: '--debug',
            description:
              'Shows debug logs when running. Disabled by default. To enable --debug=true'
          },
          {
            name: '--source-network',
            description:
              'Network where the asset is currently present. <network1|network2>'
          },
          {
            name: '--user',
            description:
              'User (wallet) ID of the reclaimer'
          },
          {
            name: '--type',
            description:
              'Type of network <bond|token>'
          },
          {
            name: '--pledge-id',
            description:
              'Pledge Id associated with asset transfer.'
          },
          {
            name: '--param',
            description:
              'Colon separated Asset Type and Asset ID or Asset Type and Num of Units.'
          },
          {
            name: '--relay-tls',
            description: 'Flag indicating whether or not the relay is TLS-enabled.'
          },
          {
            name: '--relay-tls-ca-files',
            description: 'Colon-separated list of root CA certificate paths used to connect to the relay over TLS.'
          }
        ],
        command,
        ['asset', 'transfer', 'reclaim']
      )
      return
    }

    if (options.debug === 'true') {
      logger.level = 'debug'
      logger.debug('Debugging is enabled')
    }
    if (!options['source-network'])
    {
      print.error('--source-network needs to be specified')
      return
    }
    if (!options['user'])
    {
      print.error('--user needs to be specified')
      return
    }
    if (!options['type'])
    {
      print.error('--type of network needs to be specified')
      return
    }
    if (!options['param'])
    {
      print.error('--param needs to be specified')
      return
    }
    
    const params = options['param'].split(':')
    const assetType = params[0]
    const assetCategory = options['type']
    
    if (assetCategory && !params[1])
    {
      print.error('assetId needs to be specified for "bond" type')
      return
    }
    if (assetCategory && !params[1])
    {
      print.error('num of units needs to be specified for "token" type')
      return
    }
    if (assetCategory === 'token' && isNaN(parseInt(params[1])))
    {
      print.error('num of units must be an integer for "token" type')
      return
    }
    
    const assetIdOrQuantity = (assetCategory === 'token') ? parseInt(params[1]) : params[1]
    
    const netConfig = getNetworkConfig(options['source-network'])
    if (!netConfig.connProfilePath || !netConfig.channelName || !netConfig.chaincode) {
        print.error(
            `Please use a valid --source-network. No valid environment found for ${options['source-network']} `
        )
        return
    }
    
    try {
      const userCert = await getUserCertBase64(options['source-network'], options['user'])
      const pledgeAssetDetails = await getLocalAssetPledgeDetails({
        sourceNetworkName: options['source-network'],
        pledgeId: options['pledge-id'],
        caller: options['user'],
        ccType: assetCategory,
        logger: logger
      })
      
      const viewAddress = getReclaimViewAddress(assetCategory, assetType, assetIdOrQuantity,
        options['pledge-id'], userCert, options['source-network'], pledgeAssetDetails.getRecipient(),
        pledgeAssetDetails.getRemotenetworkid(), pledgeAssetDetails.getExpirytimesecs()
      )

      const appChaincodeId = netConfig.chaincode
      const applicationFunction = (assetCategory === 'token') ? 'ReclaimTokenAsset' : 'ReclaimAsset'
      var { args, replaceIndices } = getChaincodeConfig(appChaincodeId, applicationFunction)
      args[args.indexOf('<pledge-id>')] = options['pledge-id']
      args[args.indexOf('<recipient>')] = pledgeAssetDetails.getRecipient()
      args[args.indexOf('network2')] = pledgeAssetDetails.getRemotenetworkid()
      
      await interopHelper(
        options['source-network'],
        viewAddress,
        netConfig.chaincode,
        applicationFunction,
        args,
        replaceIndices,
        options,
        print        
      )
      process.exit()
    } catch (error) {
      print.error(`Error Asset Transfer ReClaim: ${error}`)
    }
  }
}


function getReclaimViewAddress(assetCategory, assetType, assetIdOrQuantity, 
    pledgeId, pledgerCert, sourceNetwork, recipientCert,
    destNetwork, pledgeExpiryTimeSecs
) {
    let funcName = "", funcArgs = []
    if (assetCategory == "cordaAsset") {
        funcName = "GetAssetClaimStatus"
        funcArgs = [pledgeId, assetType, assetIdOrQuantity, recipientCert,
            pledgerCert, sourceNetwork, pledgeExpiryTimeSecs]
    } else if (assetCategory === "bond") {
        funcName = "GetAssetClaimStatus"
        funcArgs = [pledgeId, assetType, assetIdOrQuantity, recipientCert,
            pledgerCert, sourceNetwork, pledgeExpiryTimeSecs]
    } else if (assetCategory === "token") {
        funcName = "GetTokenAssetClaimStatus"
        funcArgs = [pledgeId, assetType, assetIdOrQuantity, recipientCert,
            pledgerCert, sourceNetwork, pledgeExpiryTimeSecs]
    } else {
        throw new Error(`Unecognized asset category: ${assetCategory}`)
    }
    
    return generateViewAddressFromRemoteConfig(destNetwork, funcName, funcArgs)
}

module.exports = command

