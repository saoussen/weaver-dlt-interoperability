---
id: asset-exchange
title: Asset Exchange
pagination_prev: external/getting-started/interop/overview
pagination_next: external/getting-started/enabling-weaver-network/overview
---

<!--
 Copyright IBM Corp. All Rights Reserved.

 SPDX-License-Identifier: CC-BY-4.0
 -->

This document lists sample ways in which you can exercise the asset-exchange interoperation protocol on the test network [launched earlier](../test-network/overview).

For this scenario, you only need the networks to be running with the appropriate contracts deployed and the ledgers bootstrapped. You do not need to run relays and drivers. You can run the following combinations of exchanges (_other combinations of DLTs will be supported soon_).

## Fabric with Fabric

One Fabric network transfers a bond from Alice to Bob in exchange for a transfer of tokens from Bob to Alice in the other network
Assuming that one of the following chaincodes have been deployed in both networks:
* `simpleasset`
* `simpleassetandinterop`
* `simpleassettransfer`
run the following steps:
1. Navigate to either the `samples/fabric/fabric-cli` folder or the `samples/fabric/go-cli` folder in your clone of the Weaver repository.
2. Run the following to verify the status of the assets owned by `alice` and `bob` in the two networks:
   ```bash
   ./scripts/getAssetStatus.sh 2
   ```
3. Complete the asset exchange in either of the two different ways:
   * Using a single command:
     - Run the following to trigger exchange of bond `bond01:a03` owned by `alice` in `network1` with `100` units of tokens `token1` owned by `bob` in `network2`:
       ```bash
       ./bin/fabric-cli asset exchange-all --network1=network1 --network2=network2 --secret=secrettext --timeout-duration=100 alice:bond01:a03:bob:token1:100
       ```
     - To verify that `bob` now owns a bond in exchange for `alice` owning some tokens, run the following:
       ```bash
       ./scripts/getAssetStatus.sh 2
       ```
   * Using step-by-step commands:
     - Run the following to trigger `alice` locking `bond01:a03` for `bob` in `network1`
       ```bash
       ./bin/fabric-cli asset exchange-step --step=1 --timeout-duration=3600 --locker=alice --recipient=bob --secret=<hash-pre-image> --target-network=network1 --param=bond01:a03
       ```
     - Run the following to verify `alice`'s lock:
       ```bash
       ./bin/fabric-cli asset exchange-step --step=2 --locker=alice --recipient=bob --target-network=network1 --param=bond01:a03
       ```
     - Run the following to trigger `bob` locking `100` units of `token1` for `alice` in `network2`:
       ```bash
       ./bin/fabric-cli asset exchange-step --step=3 --timeout-duration=1800 --locker=bob --recipient=alice --hash=<hash-value> --target-network=network2 --param=token1:100
       ```
     - Run the following to verify `bob`'s lock:
       ```bash
       ./bin/fabric-cli asset exchange-step --step=4 --locker=bob --recipient=alice --target-network=network2 --contract-id=<contract-id>
       ```
     - Run the following to trigger `alice`'s claim for `100` units of `token1` locked by `bob` in `network2`:
       ```bash
       ./bin/fabric-cli asset exchange-step --step=5 --recipient=alice --locker=bob --target-network=network2 --contract-id=<contract-id> --secret=<hash-pre-image>
       ```
     - Run the following to trigger `bob`'s claim for `bond01:a03` locked by `alice` in `network1`:
       ```bash
       ./bin/fabric-cli asset exchange-step --step=6 --recipient=bob --locker=alice --target-network=network1 --param=bond01:a03 --secret=<hash-pre-image>
       ```
       
     The above steps complete a successful asset exchange between two Fabric networks. 
     In addition to the above commands, following are the extra options:
     - If `alice` wants to unlock the bond asset, run the following to trigger `alice`'s re-claim for `bond01:a03` locked in `network1`:
       ```bash
       ./bin/fabric-cli asset exchange-step --step=7 --locker=alice --recipient=bob --target-network=network1 --param=bond01:a03
       ```
     - If `bob` wants to unlock the token asset, run the following to trigger `bob`'s re-claim for `token1:100` locked in `network2`:
       ```bash
       ./bin/fabric-cli asset exchange-step --step=8 --locker=bob --recipient=alice --target-network=network2 --contract-id=<contract-id>
       ```
       
## Fabric with Corda

We will demonstrate asset exchange of a bond in Fabric `network1` with tokens on `Corda_Network`.
For Fabric commands, run from `samples/fabric/fabric-cli` folder, and for Corda commands, run from `samples/corda/corda-simple-application` folder. Here `Alice` and `Bob` in Fabric `network1` correspond to `PartyA` (`CORDA_PORT=10006`) and `PartyB` (`CORDA_PORT=10009`) in `Corda_Network` respectively. Following are the step-by-step asset exchange process:

(_Note: the hash used in following steps can be replaced by any valid `sha256` hash_)

- Run the following to verify the status of the bond assets owned by `alice` and `bob` in the Fabric network `network1` from `samples/fabric/fabric-cli` folder:
 ```bash
 ./scripts/getAssetStatus.sh
 ```
- Run the following to verify the status of the assets owned by `PartyA` and `PartyB` in the `Corda_Network` from `samples/corda/corda-simple-application` folder:
```bash
./scripts/getAssetStatus.sh
```
- Run the following to trigger `alice` locking `bond01:a03` for `bob` in `network1` for 60 mins:
  ```bash
  ./bin/fabric-cli asset exchange-step --step=1 --timeout-duration=3600 --locker=alice --recipient=bob --hash==ivHErp1x4bJDKuRo6L5bApO/DdoyD/dG0mAZrzLZEIs= --target-network=network1 --param=bond01:a03
  ```
- Run the following to verify `alice`'s lock:
  ```bash
  ./bin/fabric-cli asset exchange-step --step=2 --locker=alice --recipient=bob --target-network=network1 --param=bond01:a03
  ```
- Run the following to trigger `PartyB` locking `50` units of token type `t1` for `PartyA` in `Corda_Network` for 30 mins:
  ```bash
  CORDA_PORT=10009 ./clients/build/install/clients/bin/clients lock-asset --fungible --hashBase64=ivHErp1x4bJDKuRo6L5bApO/DdoyD/dG0mAZrzLZEIs= --timeout=1800 --recipient="O=PartyA,L=London,C=GB" --param=t1:50
  ```
  Note the `contract-id` displayed after successful execution of the command, will be used in next steps.
- Run the following to verify `PartyB`'s lock (can be verified by both parties):
  ```bash
  CORDA_PORT=10006 ./clients/build/install/clients/bin/clients is-asset-locked --contract-id=<contract-id>
  ```
- Run the following to trigger `PartyA`'s claim for `50` units of token type `t1` locked by `PartyB` in `Corda_Network`:
  ```bash
  CORDA_PORT=10006 ./clients/build/install/clients/bin/clients claim-asset --secret=secrettext --contract-id=<contract-id>
  ```
  (_Note: Here the `PartyB` can see the node's log to get the revealed the hash preimage, to use it to claim bond in Fabric network._)
- Run the following to trigger `bob`'s claim for `bond01:a03` locked by `alice` in `network1`:
  ```bash
  ./bin/fabric-cli asset exchange-step --step=6 --recipient=bob --locker=alice --target-network=network1 --param=bond01:a03 --secret=secrettext
  ```
- Run the following to verify the status of the bond assets owned by `alice` and `bob` in the Fabric network `network1` from `samples/fabric/fabric-cli` folder:
   ```bash
   ./scripts/getAssetStatus.sh
   ```
- Run the following to verify the status of the assets owned by `PartyA` and `PartyB` in the `Corda_Network` from `samples/corda/corda-simple-application` folder:
  ```bash
  ./scripts/getAssetStatus.sh
  ```

The above steps complete a successful asset exchange between Fabric and Corda networks. 
In addition to the above commands, following are the extra options:
- If `alice` wants to unlock the bond asset, run the following to trigger `alice`'s re-claim for `bond01:a03` locked in `network1`:
  ```bash
  ./bin/fabric-cli asset exchange-step --step=7 --locker=alice --recipient=bob --target-network=network1 --param=bond01:a03
  ```
- If `PartyB` wants to unlock the token asset, run the following to trigger unlock for `t1:50` locked in `Corda_Network`:
  ```bash
  CORDA_PORT=10009 ./clients/build/install/clients/bin/clients unlock-asset --contract-id=<contract-id>
  ```
  
## Corda with Corda

We will demonstrate asset exchange of a tokens in `Corda_Network` with tokens on `Corda_Network2`. Here `PartyA` (`CORDA_PORT=10006`) and `PartyB` (`CORDA_PORT=10009`) in `Corda_Network` correspond to `PartyA` (`CORDA_PORT=30006`) and `PartyB` (`CORDA_PORT=30009`) in `Corda_Network2` respectively. Following are the step-by-step asset exchange process:

  (_Note: the hash used in following steps can be replaced by any valid `sha256` hash_)
- Navigate to `samples/corda/corda-simple-application` folder. 
- Run the following to verify the status of the tokens owned by `PartyA` and `PartyB` in the `Corda_Network` and `Corda_Network2`:
  ```bash
  ./scripts/getAssetStatus.sh 2
  ```
- Run the following to trigger `PartyA` locking `30` units of token type `t1` for `PartyB` in `Corda_Network` for 60 mins:
  ```bash
  CORDA_PORT=10006 ./clients/build/install/clients/bin/clients lock-asset --fungible --hashBase64=ivHErp1x4bJDKuRo6L5bApO/DdoyD/dG0mAZrzLZEIs= --timeout=3600 --recipient="O=PartyB,L=London,C=GB" --param=t1:30
  ```
  Note the `contract-id` displayed after successful execution of the command, will be used in next steps. Let's denote it `<contract-id-1>`.
- Run the following to verify `PartyA`'s lock (can be verified by both parties):
  ```bash
  CORDA_PORT=10009 ./clients/build/install/clients/bin/clients is-asset-locked --contract-id=<contract-id-1>
  ```
- Run the following to trigger `PartyB` locking `50` units of token type `t2` for `PartyA` in `Corda_Network2` for 30 mins:
  ```bash
  CORDA_PORT=30009 ./clients/build/install/clients/bin/clients lock-asset --fungible --hashBase64=ivHErp1x4bJDKuRo6L5bApO/DdoyD/dG0mAZrzLZEIs= --timeout=1800 --recipient="O=PartyA,L=London,C=GB" --param=t2:50
  ```
  Note the `contract-id` displayed after successful execution of the command, will be used in next steps. Let's denote it `<contract-id-2>`.
- Run the following to verify `PartyB`'s lock (can be verified by both parties):
  ```bash
  CORDA_PORT=30006 ./clients/build/install/clients/bin/clients is-asset-locked --contract-id=<contract-id-2>
  ```
- Run the following to trigger `PartyA`'s claim for `50` units of token type `t2` locked by `PartyB` in `Corda_Network2`:
  ```bash
  CORDA_PORT=30006 ./clients/build/install/clients/bin/clients claim-asset --secret=secrettext --contract-id=<contract-id-2>
  ```
  (_Note: Here the `PartyB` can see the node's log to get the revealed the hash preimage, to use it to claim bond in Fabric network._)
- Run the following to trigger `PartyB`'s claim for `30` units of token type `t1` locked by `PartyA` in `Corda_Network`:
  ```bash
  CORDA_PORT=10006 ./clients/build/install/clients/bin/clients claim-asset --secret=secrettext --contract-id=<contract-id-1>
  ```
- Run the following to verify the status of the tokens owned by `PartyA` and `PartyB` in the `Corda_Network` and `Corda_Network2`:
  ```bash
  ./scripts/getAssetStatus.sh 2
  ```


The above steps complete a successful asset exchange between two Corda networks. 
In addition to the above commands, following are the extra options:
- If `PartyA` wants to unlock the token `t1:30` asset, run the following to trigger `PartyA`'s re-claim in `Corda_Network`:
  ```bash
  CORDA_PORT=10006 ./clients/build/install/clients/bin/clients unlock-asset --contract-id=<contract-id-1>
  ```
- If `PartyB` wants to unlock the token `t2:50` asset, run the following to trigger `PartyB`'s re-claim in `Corda_Network2`:
  ```bash
  CORDA_PORT=30009 ./clients/build/install/clients/bin/clients unlock-asset --contract-id=<contract-id-2>
  ```
