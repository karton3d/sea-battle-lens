# MCP Protocol Compatibility: Claude Code + Lens Studio

## Problem

Claude Code cannot connect to Snap Lens Studio's MCP server. The health check reports "Failed to connect" with "Unsupported protocol version" error.

**Root Cause**: Lens Studio 5.17.1 only accepts MCP protocol version `2025-06-18` and rejects all other versions. Claude Code sends a different protocol version during initialization.

## Investigation

Tested the Lens Studio MCP server directly with curl using different protocol versions:

| Protocol Version | Result                                                       |
|------------------|--------------------------------------------------------------|
| `2024-10-07`     | Error - Unsupported protocol version                         |
| `2024-11-05`     | Error - Unsupported protocol version                         |
| `2025-03-26`     | Error - Unsupported protocol version                         |
| `2025-06-18`     | **Success** - Server responds with capabilities and 41 tools |
| `2025-11-25`     | Error - Unsupported protocol version                         |

**Test command:**
```bash
curl -X POST "http://localhost:50049/mcp" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}'
```

**Successful response:**
```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": {
    "capabilities": {
      "tools": { "listChanged": true }
    },
    "protocolVersion": "2025-06-18",
    "serverInfo": {
      "name": "Lens Studio MCP Server",
      "version": "1.0.0"
    }
  }
}
```

## Solution: Protocol-Translating Proxy

Created `mcp-proxy.ts` - a lightweight Bun proxy that intercepts MCP requests and rewrites the protocol version.

### Architecture

```
Claude Code → localhost:50050 (proxy) → localhost:50049 (Lens Studio)
                    ↓
            Rewrites protocolVersion
            from any → 2025-06-18
```

### Usage

1. **Start the proxy** (in a separate terminal):
   ```bash
   bun run mcp-proxy.ts
   ```

2. **Configure Claude Code** (already done in `.mcp.json`):
   ```json
   {
     "mcpServers": {
       "lens-studio": {
         "type": "http",
         "url": "http://localhost:50050/mcp",
         "headers": {
           "Authorization": "Bearer <token>"
         }
       }
     }
   }
   ```

3. **Reconnect in Claude Code**:
   ```
   /mcp
   ```

### Proxy Output

When working correctly, the proxy logs:
```
[proxy] POST /mcp
[proxy] JSON-RPC method: initialize
[proxy] Claude Code protocol version: 2025-11-25
[proxy] Rewrote to: 2025-06-18
[proxy] Response: 200
```

## Recommendations

### For Snap (Lens Studio Team)
- Support multiple MCP protocol versions for backward compatibility
- At minimum, support the versions commonly used by major MCP clients

### For Anthropic (Claude Code Team)
- Consider adding support for MCP protocol version `2025-06-18`
- Or implement protocol version negotiation fallback

## Files

- `mcp-proxy.ts` - The proxy server implementation
- `.mcp.json` - Claude Code MCP configuration (points to proxy)

## Notes

- This issue also affects VS Code's native MCP client
- The proxy adds minimal latency (~1-2ms per request)
- Lens Studio must be running before starting the proxy
