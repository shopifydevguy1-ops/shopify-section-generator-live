# Vercel Environment Variables Setup Guide

This guide explains how to configure environment variables in Vercel for the AI Section Generator.

## Quick Setup Steps

### 1. Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and log in
2. Select your project: **shopify-section-generator-live**
3. Go to **Settings** → **Environment Variables**

### 2. Add Environment Variables

Click **"Add New"** and add the following variables:

#### Required Variables

**LLM_PROVIDER** (Single or Multiple)
```
Value: groq,openrouter,together
```
- Single provider: `groq`
- Multiple providers (fallback): `groq,openrouter,together`
- Available options: `groq`, `openrouter`, `together`, `gemini`, `huggingface`

**AI_API_KEY**
```
Value: your_api_key_here
```
- For Groq: Get from https://console.groq.com/
- For OpenRouter: Get from https://openrouter.ai/
- For Together AI: Get from https://together.ai/
- For Gemini: Your existing Gemini API key
- For Hugging Face: Get from https://huggingface.co/settings/tokens

**AI_MODEL** (Optional - has defaults)
```
Value: llama-3.1-70b-instruct
```
- Groq models: `llama-3.1-70b-instruct`, `llama-3.1-8b-instant`, `mixtral-8x7b-32768`, `gemma-7b-it`
- OpenRouter: `meta-llama/llama-3.1-70b-instruct:free`
- Together AI: `meta-llama/Llama-3-70b-chat-hf`
- Gemini: `gemini-2.0-flash-exp`
- Hugging Face: `meta-llama/Meta-Llama-3-70B-Instruct`

**AI_API_URL** (Only needed for Gemini)
```
Value: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent
```
- Only required if using Gemini provider

### 3. Set Environment Scope

For each variable, select which environments it applies to:
- ✅ **Production** - Live site
- ✅ **Preview** - Pull request previews
- ✅ **Development** - Local development (optional)

**Recommended:** Select all three (Production, Preview, Development)

### 4. Example Configuration

#### Example 1: Groq Only (Recommended - Fast & Free)
```
LLM_PROVIDER = groq
AI_API_KEY = gsk_your_groq_key_here
AI_MODEL = llama-3.1-70b-instruct
```

#### Example 2: Multiple Providers with Fallback
```
LLM_PROVIDER = groq,openrouter,together
AI_API_KEY = gsk_your_groq_key_here
AI_MODEL = llama-3.1-70b-instruct
```
Note: You can use the same API key if providers support it, or use the primary provider's key

#### Example 3: Gemini (Original)
```
LLM_PROVIDER = gemini
AI_API_KEY = AIzaSyDxTRoK2kSc9e6yrJAIi3Cslx9jfcAlfEo
AI_API_URL = https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent
AI_MODEL = gemini-2.0-flash-exp
```

## Step-by-Step Instructions

### Step 1: Navigate to Environment Variables
1. Open your Vercel project dashboard
2. Click on **Settings** (gear icon in the top navigation)
3. Click on **Environment Variables** in the left sidebar

### Step 2: Add Each Variable
For each variable:
1. Click **"Add New"** button
2. Enter the **Key** (variable name)
3. Enter the **Value** (your API key or configuration)
4. Select environments: **Production**, **Preview**, **Development**
5. Click **"Save"**

### Step 3: Redeploy
After adding variables:
1. Go to **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Or push a new commit to trigger automatic deployment

## Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LLM_PROVIDER` | Yes | `groq` | Comma-separated list: `groq,openrouter,together` |
| `AI_API_KEY` | Yes | - | API key for your chosen provider(s) |
| `AI_MODEL` | No | Provider-specific | Model name (see defaults above) |
| `AI_API_URL` | No | Gemini default | Only needed for Gemini provider |

## Provider-Specific Setup

### Groq Setup
1. Sign up at https://console.groq.com/
2. Create API key
3. Set variables:
   ```
   LLM_PROVIDER=groq
   AI_API_KEY=gsk_your_key_here
   AI_MODEL=llama-3.1-70b-instruct
   ```

### OpenRouter Setup
1. Sign up at https://openrouter.ai/
2. Get API key
3. Set variables:
   ```
   LLM_PROVIDER=openrouter
   AI_API_KEY=sk-or-v1_your_key_here
   AI_MODEL=meta-llama/llama-3.1-70b-instruct:free
   ```

### Together AI Setup
1. Sign up at https://together.ai/
2. Get API key
3. Set variables:
   ```
   LLM_PROVIDER=together
   AI_API_KEY=your_together_key_here
   AI_MODEL=meta-llama/Llama-3-70b-chat-hf
   ```

### Multiple Providers (Fallback)
Set multiple providers for automatic failover:
```
LLM_PROVIDER=groq,openrouter,together
AI_API_KEY=your_primary_key_here
AI_MODEL=llama-3.1-70b-instruct
```

The system will try Groq first, then OpenRouter, then Together AI if one fails.

## Troubleshooting

### Variables Not Working?
1. **Redeploy** after adding variables
2. Check variable names are **exact** (case-sensitive)
3. Verify API keys are **valid** and not expired
4. Check **environment scope** (Production/Preview/Development)

### Testing Variables
1. Go to **Deployments** → Latest deployment
2. Click **"View Function Logs"**
3. Look for `[AI Generator]` logs to see which provider is being used

### Common Issues

**Error: "AI API key not configured"**
- Make sure `AI_API_KEY` is set in Vercel
- Redeploy after adding the variable

**Error: "Rate limit exceeded"**
- Use multiple providers: `LLM_PROVIDER=groq,openrouter,together`
- System will automatically fallback to next provider

**Error: "Model not found"**
- Check `AI_MODEL` matches provider's available models
- Use default by leaving `AI_MODEL` empty

## Best Practices

1. **Use Multiple Providers**: Set `LLM_PROVIDER=groq,openrouter,together` for reliability
2. **Keep Keys Secure**: Never commit API keys to Git
3. **Test in Preview**: Test changes in Preview environment first
4. **Monitor Usage**: Check API usage in provider dashboards
5. **Use Free Tiers**: Start with free tiers, upgrade if needed

## Quick Copy-Paste Setup

For **Groq** (Recommended):
```
LLM_PROVIDER=groq
AI_API_KEY=your_groq_key
AI_MODEL=llama-3.1-70b-instruct
```

For **Multiple Providers** (Best Reliability):
```
LLM_PROVIDER=groq,openrouter,together
AI_API_KEY=your_primary_key
AI_MODEL=llama-3.1-70b-instruct
```

## Need Help?

- Check Vercel docs: https://vercel.com/docs/concepts/projects/environment-variables
- Check provider docs for API key setup
- Review deployment logs in Vercel dashboard

