import * as ts from 'typescript';

function transform_anonymous_interfaces(source_data: string): string {
   // Create a source file from the input text
   const source_file = ts.createSourceFile(
       'temp.ts',
       source_data,
       ts.ScriptTarget.Latest,
       true
   );

   // Counter for unique interface names
   let interface_counter = 0;
   const file_name = 'temp_file';
   const interfaces: ts.InterfaceDeclaration[] = [];

   // Create transformer
   const transformer = (context: ts.TransformationContext) => {
       return (sf: ts.SourceFile) => {
           function visit(node: ts.Node): ts.Node {
               // Detect anonymous interface in 'as' expression
               if (ts.isAsExpression(node) && 
                   ts.isInterfaceDeclaration(node.type)) {
                   
                   // Create unique interface name
                   const interface_name = `${file_name}_Int${interface_counter++}`;
                   
                   // Create new interface declaration
                   const new_interface = ts.factory.createInterfaceDeclaration(
                       undefined,
                       interface_name,
                       undefined,
                       undefined,
                       node.type.members
                   );
                   
                   interfaces.push(new_interface);
                   
                   // Replace anonymous interface with named reference
                   return ts.factory.createAsExpression(
                       node.expression,
                       ts.factory.createTypeReferenceNode(interface_name)
                   );
               }
               
               return ts.visitEachChild(node, visit, context);
           }
           
           const transformed_file = ts.visitNode(sf, visit) as ts.SourceFile;
           
           // Add collected interfaces to the top of the file
           return ts.factory.updateSourceFile(
               transformed_file,
               [...interfaces, ...transformed_file.statements],
               transformed_file.isDeclarationFile,
               transformed_file.referencedFiles,
               transformed_file.typeReferenceDirectives,
               transformed_file.hasNoDefaultLib,
               transformed_file.libReferenceDirectives
           );
       };
   };

   // Apply transformation
   const result = ts.transform(source_file, [transformer]);
   const printer = ts.createPrinter({ 
       newLine: ts.NewLineKind.LineFeed,
       removeComments: false,
       // tabSize: 4
   });
   const transformed_code = printer.printFile(result.transformed[0]);

   return transformed_code;
}

// Usage example:
const input = `
const x = [
   Text(),
   "hello",
   VStack()
   .extend({ my_method() { return this; } } as interface { myfunc(): this; })
]`;

const output = transform_anonymous_interfaces(input);
console.log(output);