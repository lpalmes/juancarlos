use std::collections::HashSet;

use lsp_types::{Diagnostic, DiagnosticSeverity, Position, Range};
use swc_common::{source_map::Pos, BytePos, FileName, SourceFile, Span};
use swc_html::{
    ast::Attribute,
    parser::{error::Error, parse_file_as_document},
};
use swc_html_visit::{visit_document, Visit};

struct HtmlVisitor {
    source: String,
    text: String,
    ids: HashSet<String>,
    diagnostics: Vec<Diagnostic>,
}

impl HtmlVisitor {
    fn new(source: String, text: String) -> Self {
        HtmlVisitor {
            source,
            text,
            ids: HashSet::new(),
            diagnostics: vec![],
        }
    }
}

fn char_to_position(text: &str, i: usize) -> Position {
    let mut line = 0;
    let mut column = 0;
    for (index, c) in text.chars().enumerate() {
        if index == i {
            break;
        }

        if c == '\n' {
            column = 0;
            line += 1;
        }

        column += 1;
    }
    Position::new(line, column)
}

fn span_to_range(text: &str, span: &Span) -> Range {
    Range::new(
        char_to_position(text, span.lo.to_usize()),
        char_to_position(text, span.hi.to_usize()),
    )
}

fn error_to_diagnostic(error: &Error, text: &str) -> Diagnostic {
    Diagnostic::new_simple(
        span_to_range(text, &error.clone().into_inner().0),
        error.message().to_string(),
    )
}

impl Visit for HtmlVisitor {
    fn visit_attribute(&mut self, n: &Attribute) {
        let name = n.name.to_string();

        if name == *"class" {
            self.diagnostics.push(Diagnostic::new_with_code_number(
                span_to_range(&self.text, &n.span),
                DiagnosticSeverity::ERROR,
                12,
                Some(self.source.clone()),
                "Esto es un class".to_string(),
            ));
        }

        if name == *"id" {
            if let Some(value) = n.value.as_ref() {
                let value = value.to_string();
                if self.ids.contains(&value) {
                    self.diagnostics.push(Diagnostic::new_simple(
                        span_to_range(&self.text, &n.span),
                        "No podes tener dos veces el mismo id en un mismo html".to_string(),
                    ));
                }

                self.ids.insert(value);
            }
        }
    }
}

pub fn get_html_diagnostics(source: String, document_content: String) -> Vec<Diagnostic> {
    let mut errors: Vec<Error> = vec![];
    let source_file = SourceFile::new(
        FileName::Anon,
        false,
        FileName::Anon,
        document_content.clone(),
        BytePos(1),
    );
    let result = parse_file_as_document(&source_file, Default::default(), &mut errors);

    match result {
        Ok(document) => {
            let mut visitor = HtmlVisitor::new(source, document_content.clone());

            visit_document(&mut visitor, &document);
            visitor.diagnostics.extend(
                errors
                    .iter()
                    .map(|e| error_to_diagnostic(e, &document_content)),
            );
            visitor.diagnostics
        }
        Err(error) => {
            vec![error_to_diagnostic(&error, &document_content)]
        }
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        let input = r##"
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta http-equiv="X-UA-Compatible" content="IE=edge" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Document</title>
          </head>
          <body>
            <div id="#div">Hello</div>
            <div id="#div">Friend</div>
            <button class="super button" />
          </body>
        </html>
        "##
        .to_string();
        let _ = super::get_html_diagnostics("./input.html".to_string(), input);
    }
}
