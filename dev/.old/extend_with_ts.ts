// Core type definitions
interface BaseVElementInstance {
    // Base properties here
}

interface ExtensionRegistry {}

class VElement implements BaseVElementInstance {
    // Base implementation
}

// Extension utilities
function extend_velement<T extends Record<string, any>>(extension: T): void {
    Object.assign(VElement.prototype, extension);
}

function asExtended<T extends VElement>(element: T): T & ExtensionRegistry {
    return element as T & ExtensionRegistry;
}

interface ContextMenuElement {} 

// Usage example:
// 1. Define your extension interface
interface ContextMenuExtension {
    _context_menu?: ContextMenuElement;
    on_context_menu(): ContextMenuElement | Function | undefined;
    on_context_menu(callback: Function | ContextMenuElement | any[]): VElement;
}

// 2. Register the extension type
interface ExtensionRegistry extends ContextMenuExtension {}

// 3. Implement and apply the extension
extend_velement<ContextMenuExtension>({
    _context_menu: undefined,
    on_context_menu(callback?: Function | ContextMenuElement | any[]) {
        return this;
    }
});

// That's it! Now you can use it:
const element = asExtended(new VElement());
element.on_context_menu();  // ✓ Correctly typed
element.unknownMethod();    // ✗ Type error

/*
// Define base interfaces
interface BaseVElementInstance {
    // ... your original base properties without extensions
}

// This interface will be merged as we add extensions
interface ExtensionRegistry {}

class VElement implements BaseVElementInstance {
    // ... base implementation
}

// Runtime registry object
// const REGISTRY: ExtensionRegistry = {};

// Extension function that merges interfaces
function extend_velement<T extends Record<string, any>>(extension: T): void {
    
    // Register extension types
    // Object.assign(REGISTRY, extension);
    
    // Extend prototype at runtime
    Object.assign(VElement.prototype, extension);
}

// Helper type that combines base type with registry
type WithExtensions<T> = T & ExtensionRegistry;

// Helper function to get fully typed element
function asExtended<T extends VElement>(element: T): WithExtensions<T> {
    return element as WithExtensions<T>;
}

// Before using extend_velement, declare the extension interface
interface ExtensionRegistry extends ContextMenuExtension {}

// Now use extend_velement
interface ContextMenuElement {
    // ...
}

interface ContextMenuExtension {
    _context_menu?: ContextMenuElement;
    on_context_menu(): ContextMenuElement | Function | undefined;
    on_context_menu(callback: Function | ContextMenuElement | any[]): VElement;
}

extend_velement<ContextMenuExtension>({
    _context_menu: undefined,
    on_context_menu(callback?: Function | ContextMenuElement | any[]) {
        // Implementation
        return this;
    }
});

// Add another extension
interface AnimationExtension {
    animate(duration: number): VElement;
}

// Declare the new extension
interface ExtensionRegistry extends AnimationExtension {}

extend_velement<AnimationExtension>({
    animate(duration: number) {
        // Implementation
        return this;
    }
});

// Usage
const element = asExtended(new VElement());
element.on_context_menu();  // Should work
element.animate(1000);      // Should work
element.nonExistent();      // Should error

// You can also type check the registry directly
const checkRegistry: ExtensionRegistry = {} as any;
checkRegistry.on_context_menu;  // Should work
checkRegistry.animate;          // Should work
checkRegistry.nonExistent;      // Should error
*/