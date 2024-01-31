import {GraphCommon} from "./_common";
import {QueryTopSigncribe, SignatureSubmittion} from "../types";


export class ThegraphIndexSigncribe extends GraphCommon {


  public async topSignatures(variables: QueryTopSigncribe): Promise<SignatureSubmittion[]> {
    console.log('-----------------------------')
    console.log(variables);
    console.log('-----------------------------')
    const query = `
    query QuerySignPub($msgIndex: BigInt!, $chainId: BigInt!, $signers: [String!]!) {
      signatureSubmittions(
        orderBy: blockNumber
        orderDirection: desc
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
