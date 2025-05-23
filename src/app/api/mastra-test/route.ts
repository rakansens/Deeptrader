// src/app/api/mastra-test/route.ts
// MASTRA初期化詳細テスト用エンドポイント

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const testResults: any = {
    timestamp: new Date().toISOString(),
    steps: [],
    success: false,
    error: null,
    mastraInitialized: false
  };

  try {
    console.log('🧪 MASTRA詳細テスト開始...');
    
    // ステップ1: 環境変数確認
    console.log('🔑 ステップ1: 環境変数確認');
    const openaiKey = process.env.OPENAI_API_KEY;
    testResults.steps.push({
      step: 1,
      name: '環境変数確認',
      success: !!openaiKey,
      details: openaiKey ? `OPENAI_API_KEY設定済み (${openaiKey.length}文字)` : 'OPENAI_API_KEY未設定'
    });

    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY環境変数が設定されていません');
    }

    // ステップ2: AI SDKインポート
    console.log('📦 ステップ2: AI SDKインポート');
    try {
      const { openai } = await import("@ai-sdk/openai");
      testResults.steps.push({
        step: 2,
        name: 'AI SDKインポート',
        success: true,
        details: 'openai関数インポート成功'
      });
      console.log('✅ AI SDKインポート成功');
    } catch (error) {
      testResults.steps.push({
        step: 2,
        name: 'AI SDKインポート',
        success: false,
        details: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }

    // ステップ3: MASTRAコアインポート
    console.log('📦 ステップ3: MASTRAコアインポート');
    try {
      const { Agent } = await import("@mastra/core/agent");
      testResults.steps.push({
        step: 3,
        name: 'MASTRAコアインポート',
        success: true,
        details: 'Agent クラスインポート成功'
      });
      console.log('✅ MASTRAコアインポート成功');
    } catch (error) {
      testResults.steps.push({
        step: 3,
        name: 'MASTRAコアインポート',
        success: false,
        details: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }

    // ステップ4: MASTRAエージェント初期化
    console.log('🤖 ステップ4: MASTRAエージェント初期化');
    try {
      const { Agent } = await import("@mastra/core/agent");
      const { openai } = await import("@ai-sdk/openai");
      
      const testAgent = new Agent({
        name: "テストエージェント", 
        instructions: "このエージェントはMASTRA動作テスト用です。",
        model: openai("gpt-4o"),
      });

      testResults.steps.push({
        step: 4,
        name: 'MASTRAエージェント初期化',
        success: true,
        details: 'Agentインスタンス作成成功'
      });
      console.log('✅ MASTRAエージェント初期化成功');

      // ステップ5: MASTRA動作テスト
      console.log('🧪 ステップ5: MASTRA動作テスト');
      try {
        const testResponse = await testAgent.generate([
          {
            role: 'user',
            content: 'テスト: "MASTRA動作確認"と回答してください'
          }
        ]);

        testResults.steps.push({
          step: 5,
          name: 'MASTRA動作テスト',
          success: true,
          details: `レスポンス: ${testResponse.text?.substring(0, 100)}...`
        });

        testResults.success = true;
        testResults.mastraInitialized = true;
        console.log('🎉 MASTRA動作テスト完全成功！');

        return NextResponse.json({
          success: true,
          message: 'MASTRA初期化・動作テスト完全成功',
          testResults,
          response: testResponse.text
        });

      } catch (error) {
        testResults.steps.push({
          step: 5,
          name: 'MASTRA動作テスト',
          success: false,
          details: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }

    } catch (error) {
      testResults.steps.push({
        step: 4,
        name: 'MASTRAエージェント初期化',
        success: false,
        details: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }

  } catch (error) {
    console.error('❌ MASTRAテスト失敗:', error);
    
    return NextResponse.json({
      success: false,
      message: 'MASTRAテスト失敗',
      error: error instanceof Error ? error.message : String(error),
      testResults: testResults
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'MASTRA詳細テストエンドポイント',
    usage: 'POST /api/mastra-test でMASTRA初期化テストを実行'
  });
} 