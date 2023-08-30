const { toHexString } = require('@chainsafe/ssz')
const {
  Tree,
  zeroNode,
  LeafNode,
  toGindex,
} = require('./verify/lib/index.js')

export class IncrementalMerkleTree extends Tree {
  constructor(leaves: Buffer[]) {
    super(zeroNode(32))
    this.depth = 32
    const leafs = Array.from(leaves)
    if (leafs.length) {
      leafs.map((leave, index) => {
        const gindex = toGindex(this.depth, BigInt(index));
        const newNode = LeafNode.fromRoot(leave);
        this.setNode(gindex, newNode);
      })
    }
  }

  root() {
    return toHexString(this.rootNode.root)
  }

  getSingleProof(i: number) {
    const gindex = toGindex(32, BigInt(i))
    return super.getSingleProof(gindex)
  }

  getSingleHexProof(i: number) {
    const proof = this.getSingleProof(i)
    return proof.map(toHexString)
  }
}

module.exports.IncrementalMerkleTree = IncrementalMerkleTree

// const ls = [Buffer.alloc(32, 1), Buffer.alloc(32, 2)]
// const t = new IncrementalMerkleTree(ls)
// console.log(toHexString(t.root()))
// console.log(t.getSingleHexProof(0))
