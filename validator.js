
export class BlueprintValidator {
    constructor(app) {
        this.app = app;
    }

    /**
     * Validates the current graph against a task definition.
     * @param {Object} task - The task definition object.
     * @returns {Object} - Validation result { success: boolean, results: Array }
     */
    validateTask(task) {
        const results = [];
        let allPassed = true;

        console.group(`🔍 Validating Task: ${task.title}`);

        for (const req of task.requirements) {
            let passed = false;
            let message = "";

            try {
                switch (req.type) {
                    case 'variable_exists':
                        passed = this.checkVariable(req);
                        message = passed ? `Variable '${req.name}' exists` : `Missing variable '${req.name}'`;
                        break;
                    case 'node_exists':
                        passed = this.checkNode(req);
                        message = passed ? `Node '${req.nodeType}' exists` : `Missing node '${req.nodeType}'`;
                        break;
                    case 'connection':
                        passed = this.checkConnection(req);
                        message = passed ? `Connection valid` : `Missing connection`;
                        break;
                    case 'node_property':
                        passed = this.checkNodeProperty(req);
                        message = passed ? `Property check passed` : `Property check failed`;
                        break;
                    case 'singleton_check':
                        passed = this.checkSingleton(req);
                        message = passed ? `Singleton check passed for '${req.nodeType}'` : `Multiple instances of '${req.nodeType}' found`;
                        break;
                    default:
                        console.warn(`Unknown requirement type: ${req.type}`);
                        break;
                }
            } catch (e) {
                console.error(e);
                passed = false;
                message = `Error checking requirement: ${e.message}`;
            }

            results.push({
                description: req.description || message,
                passed: passed
            });

            if (!passed) allPassed = false;
            console.log(passed ? `✅ ${message}` : `❌ ${message}`);
        }

        console.groupEnd();
        return { success: allPassed, results };
    }

    checkVariable(req) {
        const variable = this.app.variables.variables.get(req.name);
        if (!variable) return false;
        if (req.varType && variable.type !== req.varType) return false;
        return true;
    }

    checkNode(req) {
        const nodes = [...this.app.graph.nodes.values()];
        const count = nodes.filter(n => n.nodeKey === req.nodeType).length;
        if (req.count && count !== req.count) return false;
        return count > 0;
    }

    checkConnection(req) {
        // Find source node
        const nodes = [...this.app.graph.nodes.values()];
        const sourceNodes = nodes.filter(n => n.nodeKey === req.from.nodeType);
        const targetNodes = nodes.filter(n => n.nodeKey === req.to.nodeType);

        if (sourceNodes.length === 0 || targetNodes.length === 0) return false;

        // Check if ANY instance of source is connected to ANY instance of target via the specified pins
        for (const src of sourceNodes) {
            for (const tgt of targetNodes) {
                // Find the specific pins
                const srcPin = src.pins.find(p => p.id.endsWith(req.from.pin) || p.name === req.from.pin); // heuristic match
                const tgtPin = tgt.pins.find(p => p.id.endsWith(req.to.pin) || p.name === req.to.pin);

                if (srcPin && tgtPin) {
                    // Check if they are connected
                    // Fix: Iterate over Map values
                    const isConnected = [...this.app.wiring.links.values()].some(link =>
                        (link.startPin.id === srcPin.id && link.endPin.id === tgtPin.id)
                    );
                    if (isConnected) return true;
                }
            }
        }
        return false;
    }

    checkSingleton(req) {
        const nodes = [...this.app.graph.nodes.values()];
        const count = nodes.filter(n => n.nodeKey === req.nodeType).length;
        return count <= 1;
    }

    checkNodeProperty(req) {
        const nodes = [...this.app.graph.nodes.values()];
        const targetNodes = nodes.filter(n => n.nodeKey === req.nodeType);

        for (const node of targetNodes) {
            // Check customData or direct properties
            const val = node.customData[req.property] !== undefined ? node.customData[req.property] : node[req.property];
            if (val == req.value) return true; // Loose equality for "100" vs 100

            // Special check for default values on pins if property is not on node
            if (req.property === 'defaultValue') {
                // Check input pins for a value
                // This is complex as pins are arrays. We might need a pinId in the requirement
            }
        }
        return false;
    }
}

// Sample Task Definition
export const SAMPLE_TASK = {
    taskId: "task_01_health",
    title: "Initialize Health",
    description: "Create a float variable named 'Health' and set it to 100 on BeginPlay.",
    requirements: [
        {
            type: "variable_exists",
            name: "Health",
            varType: "float",
            description: "Create a Float variable named 'Health'"
        },
        {
            type: "node_exists",
            nodeType: "EventBeginPlay",
            description: "Add Event BeginPlay node"
        },
        {
            type: "singleton_check",
            nodeType: "EventBeginPlay",
            description: "Ensure only one BeginPlay node exists"
        },
        {
            type: "node_exists",
            nodeType: "Set_Health",
            description: "Add Set Health node"
        },
        {
            type: "connection",
            from: { nodeType: "EventBeginPlay", pin: "exec_out" },
            to: { nodeType: "Set_Health", pin: "exec_in" },
            description: "Connect BeginPlay to Set Health"
        }
    ]
};
