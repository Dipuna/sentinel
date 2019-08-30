# coding=utf-8
from .db import ADDRESS as DB_ADDRESS
from .db import PASSWORD as DB_PASSWORD
from .db import USER as DB_USER
from .eth import ADDRESS as COINBASE_ADDRESS
from .eth import MAX_TX_TRY
from .eth import MIN_GAS
from .eth import PRIVATE_KEY as COINBASE_PRIVATE_KEY
from .history import ETH_TRANS_URL
from .history import MAIN_SENT_URL2
from .history import MAIN_URL
from .history import RINKEBY_SENT_URL2
from .history import RINKEBY_URL
from .history import SENT_TRANS_URL1
from .history import SENT_TRANS_URL3
from .mixer import ADDRESS as MIXER_ADDRESS
from .mixer import PRIVATE_KEY as MIXER_PRIVATE_KEY
from .referral import REFERRAL_DUMMY
from .referral import REFERRAL_URL
from .services import VPN_SERVICE
from .swaps import ADDRESS as SWAP_ADDRESS
from .swaps import BTC_BASED_COINS
from .swaps import ETHEREUM_BASED_COINS
from .swaps import FEE_PERCENTAGE
from .swaps import PRIVATE_KEY as SWAP_PRIVATE_KEY
from .swaps import TOKENS as SWAP_TOKENS
from .tokens import MAIN_TOKENS
from .tokens import RINKEBY_TOKENS
from .vars import DECIMALS
from .vars import JWT_SECRET
from .vars import LIMIT_100MB
from .vars import LIMIT_10MB
from .vars import SESSIONS_SALT
