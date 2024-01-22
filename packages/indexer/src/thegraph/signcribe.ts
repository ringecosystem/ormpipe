import {GraphCommon} from "./_common";
import {QueryTopSigncribe, SignatureSubmittion} from "../types";


export class ThegraphIndexSigncribe extends GraphCommon {


  public async topSignatures(variables: QueryTopSigncribe): Promise<SignatureSubmittion[]> {
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
