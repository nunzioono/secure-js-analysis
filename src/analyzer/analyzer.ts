import * as parser from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import generate from "@babel/generator";

/**
 * List of forbidden global properties and objects for security reasons.
 */
const forbiddenGlobals = [
  'window', 'document', 'navigator', 'location',
  'localStorage', 'sessionStorage', 'XMLHttpRequest', 'fetch'
];

/**
 * Analyzes user-provided JavaScript code, instruments it safely,
 * and prevents forbidden operations, infinite loops, and recursion.
 *
 * @param userCode - The raw JavaScript code input by the user.
 * @returns Instrumented JavaScript code string.
 * @throws If forbidden access, infinite recursion, or loops are detected.
 */
export function analyzeAndInstrument(userCode: string): string {
  const ast = parser.parse(userCode, { sourceType: "script" });
  const callGraph: Record<string, string[]> = {};

  traverse(ast, {
    FunctionDeclaration(path: NodePath<any>) {
      const functionName = path.node.id?.name;
      if (functionName) callGraph[functionName] = [];
    },
    CallExpression(path: NodePath<any>) {
      const callee = path.get("callee");
      const parentFunc = path.getFunctionParent();
      if (Array.isArray(callee) ? callee[0].isIdentifier() : callee.isIdentifier() && (parentFunc?.node.type === "FunctionDeclaration" || parentFunc?.node.type === "FunctionExpression") && parentFunc?.node.id) {
        const callerName = (parentFunc?.node.type === "FunctionDeclaration" || parentFunc?.node.type === "FunctionExpression")
          ? parentFunc?.node.id?.name
          : undefined;
        if (!callerName) return;
        const calleeName = Array.isArray(callee) ? callee[0].node.name : callee.node.name;
        callGraph[callerName] = callGraph[callerName] || [];
        callGraph[callerName].push(calleeName);
      }
    },
    MemberExpression(path: NodePath<any>) {
      const objectName = getObjectName(path.node.object);
      const propertyName = (path.node.property as any).name;
      const fullAccess = `${objectName}.${propertyName}`;

      if (forbiddenGlobals.includes(objectName) || forbiddenGlobals.includes(fullAccess)) {
        throw new Error(`Forbidden global property access detected: ${fullAccess}`);
      }
    },
    Identifier(path: NodePath<any>) {
      if (forbiddenGlobals.includes(path.node.name)) {
        throw new Error(`Forbidden global access detected: ${path.node.name}`);
      }
    },
    WhileStatement(path: NodePath<any>) { insertTimeoutCheck(path); },
    ForStatement(path: NodePath<any>) { insertTimeoutCheck(path); },
    DoWhileStatement(path: NodePath<any>) { insertTimeoutCheck(path); }
  });

  detectCycles(callGraph);

  return generate(ast, {}).code;
}

/**
 * Detects cycles in a call graph to prevent indirect recursion.
 *
 * @param graph - A call graph representing function calls.
 * @throws If a cycle (recursion) is detected.
 */
function detectCycles(graph: Record<string, string[]>): void {
  const visited = new Set<string>();
  const stack = new Set<string>();

  const visit = (node: string) => {
    if (stack.has(node)) {
      throw new Error(`Indirect recursion detected involving function: ${node}`);
    }
    if (!visited.has(node)) {
      visited.add(node);
      stack.add(node);
      (graph[node] || []).forEach(visit);
      stack.delete(node);
    }
  };

  Object.keys(graph).forEach(visit);
}

/**
 * Inserts an infinite loop timeout check into loops.
 *
 * @param path - A path to the loop AST node.
 */
function insertTimeoutCheck(path: NodePath<any>): void {
  const timeoutNode = parser.parse(`
    if (Date.now() - self.__startTime > 2000) {
      throw new Error("Execution timeout: infinite loop detected!");
    }
  `).program.body[0];

  if (path.node.body.type === "BlockStatement") {
    path.node.body.body.unshift(timeoutNode);
  } else {
    path.node.body = { type: "BlockStatement", body: [timeoutNode, path.node.body] };
  }
}

/**
 * Recursively gets the full object name (dot notation) from a nested MemberExpression.
 *
 * @param obj - An AST node object.
 * @returns A string representing the full object name.
 */
function getObjectName(obj: any): string {
  if (obj.type === "Identifier") return obj.name;
  if (obj.type === "MemberExpression") return `${getObjectName(obj.object)}.${obj.property.name}`;
  return "";
}

