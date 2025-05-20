-- トリガーを設定
-- 更新日時を自動的に更新するトリガー

-- usersテーブル用のトリガー
CREATE OR REPLACE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- profilesテーブル用のトリガー
CREATE OR REPLACE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- conversationsテーブル用のトリガー
CREATE OR REPLACE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- chat_messagesテーブル用のトリガー
CREATE OR REPLACE TRIGGER update_chat_messages_updated_at
BEFORE UPDATE ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- entriesテーブル用のトリガー
CREATE OR REPLACE TRIGGER update_entries_updated_at
BEFORE UPDATE ON entries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- trading_strategiesテーブル用のトリガー
CREATE OR REPLACE TRIGGER update_trading_strategies_updated_at
BEFORE UPDATE ON trading_strategies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- trading_historyテーブル用のトリガー
CREATE OR REPLACE TRIGGER update_trading_history_updated_at
BEFORE UPDATE ON trading_history
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- symbol_settingsテーブル用のトリガー
CREATE OR REPLACE TRIGGER update_symbol_settings_updated_at
BEFORE UPDATE ON symbol_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- chart_settingsテーブル用のトリガー
CREATE OR REPLACE TRIGGER update_chart_settings_updated_at
BEFORE UPDATE ON chart_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- indicator_settingsテーブル用のトリガー
CREATE OR REPLACE TRIGGER update_indicator_settings_updated_at
BEFORE UPDATE ON indicator_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- cached_dataテーブル用のトリガー
CREATE OR REPLACE TRIGGER update_cached_data_updated_at
BEFORE UPDATE ON cached_data
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- backtest_dataテーブル用のトリガー
CREATE OR REPLACE TRIGGER update_backtest_data_updated_at
BEFORE UPDATE ON backtest_data
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- memoriesテーブル用のトリガー
CREATE OR REPLACE TRIGGER update_memories_updated_at
BEFORE UPDATE ON memories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 