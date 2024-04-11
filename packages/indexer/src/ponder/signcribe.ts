import {GraphCommon} from "./_common";
import {QueryTopSigncribe, SignatureSubmittion} from "../types";


export class PonderIndexSigncribe extends GraphCommon {


  public async topSignatures(variables: QueryTopSigncribe): Promise<SignatureSubmittion[]> {
    // console.log('-----------------------------')
    // console.log(JSON.stringify(variables, null, 2));
    // console.log('-----------------------------')
    const query = `
    query QuerySignPub($msgIndex: BigInt!, $chainId: BigInt!, $signers: [String!]!) {
      signatureSubmittions(
        orderBy: "blockNumber"
        orderDirection: "desc"
        where: {
          srcChainId: $chainId
          msgIndex: $msgIndex
          signer_in: $signers
        }
      ) {
        items {
          id
          srcChainId
          channel
          msgIndex
          signer
          signature
          data
          msgIndex
          blockNumber
        }
      }
    }
    `;
    return await super.list({
      query,
      variables,
      schema: 'signatureSubmittions',
    });
  }

  public async existSignature(signature: string): Promise<SignatureSubmittion[]> {
    // console.log('-----------------------------')
    // console.log(JSON.stringify(variables, null, 2));
    // console.log('-----------------------------')
    const query = `
    query QuerySignPub($signature: String!) {
      signatureSubmittions(
        limit: 1
        where: {
          signature: $signature
        }
      ) {
        items {
          id
          srcChainId
          channel
          msgIndex
          signer
          signature
          data
          msgIndex
          blockNumber
        }
      }
    }
    `;
    const variables = {
      signature: signature
    }
    return await super.list({
      query,
      variables,
      schema: 'signatureSubmittions',
    });
  }

}
