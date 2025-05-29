// import async_hooks from 'async_hooks';

// // Map to store details about async resources
// interface AsyncResourceInfo {
//   type: string;
//   stack: string;
// }
// const asyncResources = new Map<number, AsyncResourceInfo>();

// const hook = async_hooks.createHook({
//     init(asyncId, type, triggerAsyncId, resource) {
//         // Capture the stack trace at creation time (skip the first two lines)
//         const err = new Error();
//         const stack = err.stack ? err.stack.split('\n').slice(2).join('\n') : 'No stack available';
//         asyncResources.set(asyncId, { type, stack });
//     },
//     destroy(asyncId) {
//         console.log("Destroy", asyncId)
//         asyncResources.delete(asyncId);
//     },
//     // You can also implement other hooks (e.g., before, after) if needed
// });
// hook.enable();

// // Function to dump all active async resources with their stack traces:
// function dumpActiveAsyncResources() {
//     console.log("dumpActiveAsyncResources: active async processes")
//   for (const [asyncId, info] of asyncResources) {
//     console.log(`\nAsyncID: ${asyncId}, Type: ${info.type}\n`);
//     console.log(`${info.stack}\n`);
//   }
// }

// // For example, call this in your Server.stop() to inspect what’s still running:
// // setTimeout(() => {
// //   dumpActiveAsyncResources();
// //   hook.disable(); // Optionally disable the hook when done
// //   console.log('Dump complete. Check async-trace.log for details.');
// // }, 6000);



import async_hooks from 'async_hooks';

interface AsyncResourceInfo {
    type: string;
    stack: string;
    timestamp: number;
    trigger_id: number;
    resource: any;
}

export class ThreadMonitor {
    private async_resources = new Map<number, AsyncResourceInfo>();
    private ignored_types = new Set([
        'TIMERWRAP',
        'PROMISE',
        'RANDOMBYTESREQUEST',
        'DNSCHANNEL',
        'Immediate'
    ]);
    
    private hook: async_hooks.AsyncHook;
    
    constructor() {
        this.hook = async_hooks.createHook({
            init: (async_id, type, trigger_id, resource) => {
                if (this.ignored_types.has(type)) return;
                
                const err = new Error();
                const stack = err.stack 
                    ? err.stack.split('\n')
                        .slice(2)  // Remove first two lines (Error and this function)
                        .filter(line => !line.includes('node:internal/'))  // Filter out Node.js internal calls
                        .join('\n')
                    : 'No stack available';
                    
                this.async_resources.set(async_id, {
                    type,
                    stack,
                    timestamp: Date.now(),
                    trigger_id,
                    resource,
                });
            },
            
            destroy: (async_id) => {
                this.async_resources.delete(async_id);
            }
        });
    }

    start() {
        this.hook.enable();
    }

    stop() {
        this.hook.disable();
    }

    dump_active_resources(options: {
        min_age?: number;           // Minimum age in ms to include
        types?: string[];          // Only show these types
        exclude_types?: string[];  // Exclude these types
        include_internal?: boolean // Include Node.js internal operations
    } = {}) {
        const now = Date.now();
        let resources = Array.from(this.async_resources.entries());

        // Apply filters
        if (typeof options.min_age === "number") {
            resources = resources.filter(([_, info]) => 
                now - info.timestamp >= options.min_age!
            );
        }

        if (options.types != null) {
            resources = resources.filter(([_, info]) => 
                options.types!.includes(info.type)
            );
        }

        if (options.exclude_types != null) {
            resources = resources.filter(([_, info]) => 
                !options.exclude_types!.includes(info.type)
            );
        }

        if (!options.include_internal != null) {
            resources = resources.filter(([_, info]) => 
                !info.stack.includes('node:internal/')
            );
        }

        // Sort by age (oldest first)
        resources.sort((a, b) => a[1].timestamp - b[1].timestamp);

        console.log('\n=== Active Async Resources ===');
        if (resources.length === 0) {
            console.log('No active resources matching criteria');
            return;
        }

        for (const [async_id, info] of resources) {
            const age = Math.round((now - info.timestamp) / 1000);
            console.log(`\nAsyncID: ${async_id}`);
            console.log(`Type: ${info.type}`);
            console.log(`Age: ${age}s`);
            console.log(`Trigger ID: ${info.trigger_id}`);
            console.log('Stack trace:');
            console.log(info.stack);
            console.log('-'.repeat(40));
        }
    }

    get_resource_count(): { [key: string]: number } {
        const counts: { [key: string]: number } = {};
        for (const info of this.async_resources.values()) {
            counts[info.type] = (counts[info.type] || 0) + 1;
        }
        return counts;
    }
}
export default ThreadMonitor;