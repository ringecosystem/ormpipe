import {GraphCommon} from "./_common";
import {QueryTopSigncribe, SignatureSubmittion} from "../types";


export class ThegraphIndexSigncribe extends GraphCommon {


  public async topSignatures(variables: QueryTopSigncribe): Promise<SignatureSubmittion[]> {
    const query = `
    query QuerySignPub($limit: Int!, $chainId: BigInt!, $signers: [String!]!) {
      signatureSubmittions(
        orderBy: blockNumber
        orderDirection: desc
        first: $limit
        where: {
          chainId: $chainId
          signer_in: $signers
        }
      ) {
        id
        chainId
        signer
        signature
        data
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
