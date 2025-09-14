from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
import pandas as pd

app = Flask(__name__)
CORS(app)

@app.route('/history', methods=['GET'])
def get_history():
    ticker_symbol = request.args.get('symbol', default='AAPL', type=str)
    period = request.args.get('period', default='1mo', type=str)
    interval = request.args.get('interval', default='1d', type=str)

    try:
        ticker = yf.Ticker(ticker_symbol)
        data = ticker.history(period=period, interval=interval)

        if data.empty:
            return jsonify({"error": "No data found for the given parameters"}), 404

        # Convert timestamp to seconds since epoch
        data.reset_index(inplace=True)
        data['time'] = data['Date'].astype('int64') // 10**9

        # TradingView expects 'time', 'open', 'high', 'low', 'close', 'volume'
        data.rename(columns={
            'Open': 'open',
            'High': 'high',
            'Low': 'low',
            'Close': 'close',
            'Volume': 'volume'
        }, inplace=True)

        # Select and reorder columns
        chart_data = data[['time', 'open', 'high', 'low', 'close', 'volume']].to_dict('records')

        return jsonify(chart_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
