import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
const filePath = 'todo.txt';
// Create server instance
const server = new McpServer({
    name: "todo app",
    version: "1.0.0",
    capabilities: {
        resources: {},
        tools: {},
    },
});
// Format alert data
function formatAlert(feature) {
    const props = feature.properties;
    return [
        `Event: ${props.event || "Unknown"}`,
        `Area: ${props.areaDesc || "Unknown"}`,
        `Severity: ${props.severity || "Unknown"}`,
        `Status: ${props.status || "Unknown"}`,
        `Headline: ${props.headline || "No headline"}`,
        "---",
    ].join("\n");
}
async function writeFile(content) {
    await fs.writeFile(filePath, content, 'utf8');
}
async function readFile() {
    const data = fs.readFile(filePath, 'utf8');
    return data;
}
// Register weather tools
server.tool("save-todo", "Save a todo list to a file", {
    todo: z.string().describe("Todo list to save"),
}, async ({ todo }) => {
    try {
        writeFile(todo);
        return {
            content: [
                {
                    type: "text",
                    text: "Todo list saved successfully",
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: "Error writing file",
                },
            ],
        };
    }
});
server.tool("get-todo", "Get todo list from a file", {}, async ({}) => {
    console.log("Reading file");
    const fileContent = await readFile();
    if (!fileContent) {
        return {
            content: [
                {
                    type: "text",
                    text: "Error reading file",
                },
            ],
        };
    }
    else {
        return { content: [{ type: "text", text: fileContent }] };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Weather MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
