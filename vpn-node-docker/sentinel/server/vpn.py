# coding=utf-8
import json
import time

import falcon

from ..db import db
from ..vpn import Keys
from ..vpn import disconnect_client


class GenerateOVPN(object):
    def on_post(self, req, res):
        """
        @api {post} /ovpn Get OVPN file data.
        @apiName GenerateOVPN
        @apiGroup VPN
        @apiParam {String} account_addr Client account address.
        @apiParam {String} vpn_addr VPN server account address.
        @apiParam {String} token Token for connecting to VPN server.
        @apiSuccess {Object} node Node details including ovpn data.
        """
        account_addr = str(req.body['account_addr']).lower()
        vpn_addr = str(req.body['vpn_addr']).lower()
        token = str(req.body['token'])

        client = db.clients.find_one({
            'account_addr': account_addr,
            'token': token
        })
        if client is not None:
            name = str(int(time.time() * (10 ** 6)))
            _ = db.clients.find_one_and_update({
                'account_addr': account_addr,
                'token': token
            }, {
                '$set': {
                    'session_name': 'client' + name,
                    'usage': {
                        'up': 0,
                        'down': 0
                    }
                }
            })
            data = db.node.find_one({
                'account_addr': vpn_addr
            })
            keys = Keys(name=name)
            keys.generate()
            message = {
                'success': True,
                'node': {
                    'location': data['location'],
                    'net_speed': data['net_speed'],
                    'vpn': {
                        'ovpn': keys.ovpn()
                    }
                },
                'session_name': 'client' + name
            }
        else:
            message = {
                'success': False,
                'message': 'Wrong client wallet address or token.'
            }

        res.status = falcon.HTTP_200
        res.body = json.dumps(message)


class Disconnect(object):
    def on_post(self, req, res):
        """
        @api {post} /disconnect Disconnect client from VPN server.
        @apiName Disconnect
        @apiGroup VPN
        @apiParam {String} account_addr Client account address.
        @apiParam {String} token Token for connecting to VPN server.
        """
        account_addr = str(req.body['account_addr']).lower()
        token = str(req.body['token'])

        client = db.clients.find_one({
            'account_addr': account_addr,
            'token': token
        })
        if client is None:
            message = {
                'success': False,
                'message': 'Wrong client wallet address or token.'
            }
        else:
            disconnect_client(client['session_name'])
            message = {
                'success': True,
                'message': 'Disconnected successfully.'
            }

        res.status = falcon.HTTP_200
        res.body = json.dumps(message)
