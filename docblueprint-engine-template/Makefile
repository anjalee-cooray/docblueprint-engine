.PHONY: interview generate validate help

interview: ## Run the AI interview to build .docblueprint.json
	npx docblueprint-engine interview

generate: ## Generate all documentation from .docblueprint.json
	npx docblueprint-engine generate:docs

validate: ## Validate consistency across all generated documents
	npx docblueprint-engine validate

help: ## Show available make targets
	@echo ""
	@echo "docblueprint-engine — available commands"
	@echo "────────────────────────────────────────"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  %-12s %s\n", $$1, $$2}'
	@echo ""
	@echo "Typical workflow:"
	@echo "  1. make interview   — answer questions, builds .docblueprint.json"
	@echo "  2. make generate    — AI generates all 99 docs layer by layer"
	@echo "  3. make validate    — checks consistency and flags stale docs"
	@echo ""

.DEFAULT_GOAL := help
