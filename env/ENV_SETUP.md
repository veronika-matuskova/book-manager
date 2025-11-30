# Environment Variables Setup

## Quick Start

1. **Create your `.env` file** by copying the template below
2. **Fill in your actual credentials**
3. The `.env` file is already in `.gitignore` and will not be committed

## .env File Template

Create a file named `.env` in the project root with the following content:

```env
# Amazon Kindle Library
READ_AMAZON_URL=https://read.amazon.com/kindle-library
AMAZON_USERNAME=your_amazon_username
AMAZON_PASSWORD=your_amazon_password

# StoryGraph
STORY_GRAPH_APP_URL=https://app.thestorygraph.com
STORY_GRAPH_USERNAME=your_storygraph_username
STORY_GRAPH_PASSWORD=your_storygraph_password
```

## Using Configuration in Your Code

```typescript
import { config } from './src/config';

// Access configuration values
const username = config.amazonUsername;
const password = config.amazonPassword;
const url = config.readAmazonUrl;
```

## Security Notes

- ✅ **DO**: Store credentials in `.env` file
- ✅ **DO**: Keep `.env` in `.gitignore` (already configured)
- ❌ **DON'T**: Commit `.env` file to repository
- ❌ **DON'T**: Store passwords in code or config files

## Troubleshooting

If you get an error about missing environment variables:
1. Make sure `.env` file exists in the project root
2. Check that all required variables are set
3. Verify there are no typos in variable names

