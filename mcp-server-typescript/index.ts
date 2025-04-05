import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";
import fs from "fs/promises";
import * as path from 'path';
import { time } from "console";

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


const FILE_PATH = path.join("./", 'todos.json');

interface Todo {
    uuid: string;
    time: string;
    todo: string;
}

// Function to add a new todo (async)
async function addTodo(newTodo: Todo): Promise<void> {
    let todos: Todo[] = [];

    try {
        // Check if file exists and read existing todos
        const fileContent = await fs.readFile(FILE_PATH, 'utf8').catch(() => '[]');
        todos = JSON.parse(fileContent);
    } catch (error) {
        console.error('Error reading the file:', error);
    }

    // Append the new todo
    todos.push(newTodo);

    try {
        // Write updated list back to file
        await fs.writeFile(FILE_PATH, JSON.stringify(todos, null, 2), 'utf8');
        console.log('Todo added successfully.');
    } catch (error) {
        console.error('Error writing to the file:', error);
    }
}

// Function to get a todo by UUID (async)
async function getTodoByUUID(uuid: string): Promise<Todo | null> {
    try {
        // Read and parse file
        const fileContent = await fs.readFile(FILE_PATH, 'utf8').catch(() => '[]');
        const todos: Todo[] = JSON.parse(fileContent);

        // Find the todo with the given UUID
        const foundTodo = todos.find(todo => todo.uuid === uuid);
        return foundTodo || null;
    } catch (error) {
        console.error('Error reading the file:', error);
        return null;
    }
}



// Register todo tools
server.tool(
    "save-todo",
    "Save, create, make, generate, a todo to a file",
    {
      todo: z.string().describe("Todo to save"),
      time: z.string().describe("Time of the todo"),
      uuid: z.string().describe("UUID of the todo"),

    },
    async ({ todo,time,uuid }) => {
      const newTodo: Todo = {
        uuid: uuid,
        time: time,
        todo: todo,
    };
      try {
        addTodo(newTodo);
      return {
          content: [
            {
              type: "text",
              text: "Todo list saved successfully",
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: "Error writing file",
            },
          ],
        };
      }

  
    
    },
  );
  
  server.tool(
    "get-todo",
    "Get todo list from a file",
    {
      uuid: z.string().describe("UUID of the todo"),
    },
    async ({uuid}) => {

     
      const fileContent = await getTodoByUUID(uuid);
      if(!fileContent) {
        return {
          content: [
            {
              type: "text",
              text: "Error reading file",
            },
          ],
        };
      }
      else{
        return {content: [{type: "text", text: fileContent.todo}]};
      }
     
    
    },
  );

  async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Weather MCP Server running on stdio");
  }
  
  main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
  });
  