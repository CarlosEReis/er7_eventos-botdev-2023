const crypto = require("crypto");
const axios = require("axios");

const API_URL = 'https://testnet.binance.vision'; //https://api.binance.com
const API_KEY = 'F7eIqJKyy0AwXPNB14JyjzHr6FQKvEhXjRNRO2QtwRS8qmdgyjEekS7n0sFm8BSL';
const SECRET_KEY = 'Kj4G1ACqIJOrZ0gDGQJYN6lhmcHsD5APxa5AUWE7IDzgfHmmBgLPWwpg7uS03jAX';

const SYMBOL = "BTCUSDT";
const QUANTITY = "0.001";
const BUY_PRICE = 34160;
const SELL_PRICE = 34501;

const LIMIT = 21// qtde velas
const INTERVAL = '15m';// interval gráfico da análise

let isOpened = false;

// SMA = Simple Movie Average (Média movel simples)
function calcSMA(data) {
    const closes = data.map(candle => parseFloat(candle[4]));
    const sum = closes.reduce((a,b) => a + b);
    return sum / data.length;
}

async function start() {
    const { data } = await axios.get(API_URL + '/api/v3/klines?limit='+ LIMIT + '&interval='+ INTERVAL +'&symbol=' + SYMBOL)
    const candle = data[data.length - 1];
    const price = parseFloat(candle[4]);

    console.clear();
    console.log('Price: ', price);

    const sma = calcSMA(data);
    console.log('SMA: ', sma);
    console.log('Is Opened?: ', isOpened);

    if( price <= (sma * 0.9) && isOpened === false) {
        isOpened = true;
        newOrder(SYMBOL, QUANTITY, 'buy');
        console.log('comprar');
    }
    else if (price >= (sma * 1.1) && isOpened === true) {
        isOpened = false;
        newOrder(SYMBOL, QUANTITY, 'sell');
        console.log('vender');
    }
    else
        console.log('aguardar');
}

async function newOrder(symbol, quantity, side) {
    const order = {symbol, quantity, side};
    order.type = "MARKET";
    order.timestamp = Date.now();

    const signature =  crypto
        .createHmac("sha256", SECRET_KEY)
        .update(new URLSearchParams(order).toString())
        .digest("hex");

    order.signature = signature;

    try {
        const { data } = await axios.post(
            API_URL + "/api/v3/order",
            new URLSearchParams(order).toString(),
            { headers: { "X-MBX-APIKEY": API_KEY } }
        )

        console.log(data);
    } catch (error) {
        console.log(error.response.data);
    }
}

setInterval(start, 3000);

start();