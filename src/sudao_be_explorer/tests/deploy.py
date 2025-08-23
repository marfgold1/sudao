#!/usr/bin/env python3

from pocket_ic import PocketIC
import unittest
from os import path, environ
from ic.candid import Types, encode, decode
from ic import Canister

environ["POCKET_IC_BIN"] = "/usr/local/bin/pocket-ic"

EXPLORER = "sudao_be_explorer"
BACKEND = "sudao_backend"
BASE_CANISTERS_PATH = (
    path.dirname(path.realpath(__file__))
    + "/../../../"
    + f".dfx/local/canisters/"
)

class BackendCanisterTests(unittest.TestCase):
    def setUp(self) -> None:
        if not path.isdir(BASE_CANISTERS_PATH + EXPLORER) or not path.isdir(BASE_CANISTERS_PATH + BACKEND):
            raise Exception('Run "dfx build" before running tests')
        with open(BASE_CANISTERS_PATH + f"{EXPLORER}/{EXPLORER}.wasm", "rb") as wasm:
            self.explorerWasm = wasm.read()
        with open(BASE_CANISTERS_PATH + f"{EXPLORER}/{EXPLORER}.did", "r") as candid:
            self.explorerCandid = candid.read()
        with open(BASE_CANISTERS_PATH + f"{BACKEND}/{BACKEND}.wasm", "rb") as wasm:
            self.backendWasm = wasm.read()
        with open(BASE_CANISTERS_PATH + f"{BACKEND}/{BACKEND}.did", "r") as candid:
            self.backendCandid = candid.read()
        return super().setUp()

    def test_backend_canister_greet(self):
        # Create and install canister
        pic = PocketIC()
        canister = pic.create_and_install_canister_with_candid(self.explorerCandid, self.explorerWasm)

        # Sideload wasm
        payload = [{"type": Types.Vec(Types.Nat8), "value": self.backendWasm}, {"type": Types.Text, "value": "lol"}]
        raw_response = pic.update_call(canister.canister_id, "setWasmCode", encode(payload))
        response = decode(raw_response, canister.setWasmCode.rets)
        self.assertTrue('ok' in response[0]['value'])

        # Add DAO
        dao_info = {"name": "test", "description": "testing", "tags": ["hi"]}
        response = canister.addDAO(dao_info)
        self.assertTrue('ok' in response[0])
        dao_id = response[0]['ok']

        # Tick until DAO is deployed
        be_can_id = None
        while True:
            response = canister.getDAO(dao_id)
            deploy_status = response[0][0]['deploymentStatus']
            if 'deployed' in deploy_status:
                be_can_id = deploy_status['deployed']['canisterId']
                break
            pic.tick()
        
        # Verify backend canister is deployed and have the correct dao info
        be_canister = Canister(pic, be_can_id, self.backendCandid)
        dao_actual_info = be_canister.getSystemInfo()[0]['daoInfo'][0]
        self.assertEqual(dao_info['name'], dao_actual_info['name'])
        self.assertEqual(dao_info['description'], dao_actual_info['description'])
        self.assertEqual(dao_info['tags'], dao_actual_info['tags'])
        self.assertEqual(canister.agent.sender.to_str(), dao_actual_info['creator'].to_str())


if __name__ == "__main__":
    unittest.main()