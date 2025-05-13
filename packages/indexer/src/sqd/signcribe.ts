import { QueryTopSigncribe } from "../types";
import { SignatureSubmittion } from "../types/sqd";
import { GraphCommon } from "./_common";

export class SqdIndexSigncribe extends GraphCommon {
  public async topSignatures(
    variables: QueryTopSigncribe
  ): Promise<SignatureSubmittion[]> {
    const query = `
    query QuerySignPub(
      $msgIndex: BigInt!
      $chainId: BigInt!
      $signers: [String!]!
    ) {
      signaturePubSignatureSubmittions(
        limit: 100
        orderBy: blockNumber_DESC
        where: {
          chainId_eq: $chainId
          msgIndex_eq: $msgIndex
          signer_in: $signers
        }
      ) {
        id
        chainId
        channel
        msgIndex
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
      schema: "signaturePubSignatureSubmittions",
    });
  }

  public async existSignature(
    variables: QueryTopSigncribe,
    signature: string
  ): Promise<boolean> {
    // console.log('-----------------------------')
    // console.log(JSON.stringify(variables, null, 2));
    // console.log('-----------------------------')
    const query = `
    query QuerySignPub(
      $msgIndex: BigInt!
      $chainId: BigInt!
      $signers: [String!]!
    ) {
      signaturePubSignatureSubmittions(
        limit: 100
        orderBy: blockNumber_DESC
        where: {
          chainId_eq: $chainId
          msgIndex_eq: $msgIndex
          signer_in: $signers
        }
      ) {
        id
        chainId
        channel
        msgIndex
        signer
        signature
        data
        msgIndex
        blockNumber
      }
    }
    `;
    const list: SignatureSubmittion[] = await super.list({
      query,
      variables,
      schema: "signaturePubSignatureSubmittions",
    });
    for (const item of list) {
      if (item.signature == signature) {
        return true;
      }
    }
    return false;
  }
}
