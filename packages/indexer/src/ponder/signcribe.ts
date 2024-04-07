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
        orderBy: blockNumber
        orderDirection: desc
        first: 10
        where: {
          chainId: $chainId
          msgIndex: $msgIndex
          signer_in: $signers
        }
      ) {
        id
        chainId
        msgIndex
        signer
        signature
        data
        msgIndex
        blockNumber
      }
    }
    `;
    return await super.list({
      query,
      variables,
      schema: 'signatureSubmittions',
    });
  }

}
