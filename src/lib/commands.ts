// チャット用コマンドシステム
export interface ChatCommand {
  command: string;
  description: string;
  category: 'trading' | 'chart' | 'analysis' | 'general';
  args?: CommandArg[];
}

export interface CommandArg {
  name: string;
  type: 'string' | 'number' | 'select';
  required: boolean;
  description: string;
  options?: string[]; // select type用
}

// トレーディング特化のコマンド定義
export const CHAT_COMMANDS: ChatCommand[] = [
  // チャート関連
  {
    command: '/chart',
    description: 'チャートを表示・分析する',
    category: 'chart',
    args: [
      {
        name: 'symbol',
        type: 'select',
        required: false,
        description: 'トレーディングペア',
        options: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'SOLUSDT']
      },
      {
        name: 'timeframe',
        type: 'select',
        required: false,
        description: '時間足',
        options: ['1m', '5m', '15m', '1h', '4h', '1d', '1w']
      }
    ]
  },
  {
    command: '/indicator',
    description: 'テクニカル指標を追加・分析する',
    category: 'trading',
    args: [
      {
        name: 'type',
        type: 'select',
        required: true,
        description: '指標タイプ',
        options: ['SMA', 'EMA', 'RSI', 'MACD', 'Bollinger Bands', 'Stochastic', 'ATR']
      },
      {
        name: 'period',
        type: 'number',
        required: false,
        description: '期間設定'
      }
    ]
  },
  
  // 分析関連
  {
    command: '/analysis',
    description: '包括的な市場分析を実行',
    category: 'analysis',
    args: [
      {
        name: 'type',
        type: 'select',
        required: false,
        description: '分析タイプ',
        options: ['technical', 'fundamental', 'sentiment', 'all']
      }
    ]
  },
  {
    command: '/trend',
    description: 'トレンド分析を表示',
    category: 'analysis'
  },
  {
    command: '/support',
    description: 'サポート・レジスタンスレベルを識別',
    category: 'analysis'
  },
  {
    command: '/volume',
    description: 'ボリューム分析を実行',
    category: 'analysis'
  },
  
  // 取引関連
  {
    command: '/portfolio',
    description: 'ポートフォリオの状況を確認',
    category: 'trading'
  },
  {
    command: '/strategy',
    description: '取引戦略を提案・検証',
    category: 'trading',
    args: [
      {
        name: 'style',
        type: 'select',
        required: false,
        description: '取引スタイル',
        options: ['scalping', 'day-trading', 'swing', 'position']
      }
    ]
  },
  {
    command: '/risk',
    description: 'リスク管理計算を実行',
    category: 'trading',
    args: [
      {
        name: 'amount',
        type: 'number',
        required: false,
        description: '投資金額'
      }
    ]
  },
  
  // 一般コマンド
  {
    command: '/help',
    description: '利用可能なコマンドを表示',
    category: 'general'
  },
  {
    command: '/clear',
    description: 'チャット履歴をクリア',
    category: 'general'
  },
  {
    command: '/export',
    description: 'チャット履歴をエクスポート',
    category: 'general',
    args: [
      {
        name: 'format',
        type: 'select',
        required: false,
        description: 'エクスポート形式',
        options: ['json', 'txt', 'csv']
      }
    ]
  },
  {
    command: '/screenshot',
    description: 'チャートのスクリーンショットを撮影',
    category: 'general'
  }
];

/**
 * コマンド補完候補を検索
 * @param input 入力テキスト
 * @returns 一致するコマンドのリスト
 */
export function searchCommands(input: string): ChatCommand[] {
  if (!input.startsWith('/')) return [];
  
  const query = input.toLowerCase().slice(1); // '/'を除去
  
  if (query === '') {
    // '/'のみの場合は全コマンドを返す
    return CHAT_COMMANDS;
  }
  
  return CHAT_COMMANDS.filter(cmd => 
    cmd.command.toLowerCase().includes(query) ||
    cmd.description.toLowerCase().includes(query)
  ).slice(0, 10); // 最大10件
}

/**
 * コマンドの引数文字列を解析
 * @param commandText コマンド全体のテキスト
 * @returns 解析された引数オブジェクト
 */
export function parseCommandArgs(commandText: string): Record<string, string> {
  const parts = commandText.trim().split(/\s+/);
  const command = parts[0];
  const args: Record<string, string> = {};
  
  // コマンド定義を検索
  const cmdDef = CHAT_COMMANDS.find(c => c.command === command);
  if (!cmdDef || !cmdDef.args) return args;
  
  // 位置引数として解析
  for (let i = 1; i < parts.length && i - 1 < cmdDef.args.length; i++) {
    const argDef = cmdDef.args[i - 1];
    args[argDef.name] = parts[i];
  }
  
  return args;
}

/**
 * コマンドを実際のチャット用テキストに変換
 * @param command コマンド文字列
 * @returns チャット送信用のテキスト
 */
export function commandToText(command: string): string {
  const cmd = command.split(' ')[0];
  const args = parseCommandArgs(command);
  
  switch (cmd) {
    case '/chart':
      return `${args.symbol || 'BTCUSDT'}の${args.timeframe || '1h'}チャートを表示して分析してください`;
    
    case '/indicator':
      const period = args.period ? ` (期間: ${args.period})` : '';
      return `${args.type}指標を分析してください${period}`;
    
    case '/analysis':
      const type = args.type || 'all';
      return `${type === 'all' ? '包括的な' : type}市場分析を実行してください`;
    
    case '/trend':
      return '現在のトレンド分析を実行してください';
    
    case '/support':
      return 'サポート・レジスタンスレベルを分析してください';
    
    case '/volume':
      return 'ボリューム分析を実行してください';
    
    case '/portfolio':
      return 'ポートフォリオの状況を確認してください';
    
    case '/strategy':
      const style = args.style ? `${args.style}スタイルの` : '';
      return `${style}取引戦略を提案してください`;
    
    case '/risk':
      const amount = args.amount ? ` (投資金額: ${args.amount})` : '';
      return `リスク管理計算を実行してください${amount}`;
    
    case '/help':
      return generateHelpText();
    
    default:
      return command; // そのまま返す
  }
}

/**
 * ヘルプテキストを生成
 */
function generateHelpText(): string {
  const categories = {
    'chart': '📊 **チャート関連**',
    'trading': '💹 **取引関連**', 
    'analysis': '📈 **分析関連**',
    'general': '⚙️ **一般機能**'
  };
  
  let helpText = '# 利用可能なコマンド\n\n';
  
  Object.entries(categories).forEach(([category, title]) => {
    helpText += `${title}\n`;
    const commands = CHAT_COMMANDS.filter(cmd => cmd.category === category);
    commands.forEach(cmd => {
      helpText += `- \`${cmd.command}\` - ${cmd.description}\n`;
    });
    helpText += '\n';
  });
  
  helpText += '💡 **使用例:**\n';
  helpText += '- `/chart ETHUSDT 4h` - ETHUSDTの4時間足チャートを分析\n';
  helpText += '- `/indicator RSI 14` - RSI(14)を分析\n';
  helpText += '- `/analysis technical` - テクニカル分析を実行\n';
  
  return helpText;
} 