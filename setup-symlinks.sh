#!/bin/bash

# setup-symlinks.sh - Tool symlink configuration script for Spec-Driven Development

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "=== Spec-Driven Development Symlink Setup ==="
echo "Project root detected: $PROJECT_ROOT"
echo

show_help() {
    echo "Usage: ./setup-symlinks.sh [tool]"
    echo "Supported tools:"
    echo "  claude    Configure symlinks for Claude Code"
    echo "  cursor    Configure symlinks for Cursor"
    echo "  codex     Configure symlinks for Codex CLI"
    echo "  gemini    Configure symlinks for Gemini CLI (GEMINI.md)"
    echo "  windsurf  Configure symlinks for Windsurf (.windsurfrules)"
    echo "  copilot   Configure symlinks for GitHub Copilot (.github/copilot-instructions.md)"
    echo "  all       Configure symlinks for ALL supported tools"
    echo "  clean     Remove all created symlinks"
}

create_symlink() {
    local src="$1"
    local dest="$2"
    
    # If destination exists and is a symlink, remove it to overwrite safely
    if [ -L "$dest" ]; then
        rm "$dest"
    elif [ -e "$dest" ]; then
        echo "Warning: File/Directory '$dest' already exists and is not a symlink. Skipping."
        return
    fi
    
    # Ensure parent directory of dest exists
    mkdir -p "$(dirname "$dest")"
    
    echo "Creating symlink: $dest -> $src"
    ln -sf "$src" "$dest"
}

setup_gemini() {
    echo "Configuring for Gemini CLI..."
    create_symlink "AGENTS.md" "GEMINI.md"
    echo "Gemini CLI setup completed successfully!"
    echo
}

setup_claude() {
    echo "Configuring for Claude Code..."
    create_symlink "AGENTS.md" "CLAUDE.md"
    mkdir -p .claude
    create_symlink "../.agents/skills" ".claude/skills"
    create_symlink "../.agents/personas" ".claude/agents"
    create_symlink "../.agents/workflows" ".claude/commands"
    echo "Claude Code setup completed successfully!"
    echo
}

setup_cursor() {
    echo "Configuring for Cursor..."
    mkdir -p .cursor/rules
    echo "Generating .cursor/rules/agents.mdc..."
    printf -- '---\ndescription: "SDD workspace rules — always active"\nglobs: ["**/*"]\nalwaysApply: true\n---\n\n' > .cursor/rules/agents.mdc
    cat AGENTS.md >> .cursor/rules/agents.mdc
    create_symlink "../../.agents/skills" ".cursor/skills"
    echo "Cursor setup completed successfully!"
    echo
}

setup_codex() {
    echo "Configuring for Codex CLI..."
    create_symlink "AGENTS.md" "CODEX.md"
    echo "Codex CLI setup completed successfully!"
    echo
}

setup_windsurf() {
    echo "Configuring for Windsurf..."
    create_symlink "AGENTS.md" ".windsurfrules"
    mkdir -p .windsurf/rules
    create_symlink "../../.agents/rules/coding.md" ".windsurf/rules/coding.md"
    create_symlink "../../.agents/rules/security.md" ".windsurf/rules/security.md"
    create_symlink "../../.agents/rules/style.md" ".windsurf/rules/style.md"
    echo "Windsurf setup completed successfully!"
    echo
}

setup_copilot() {
    echo "Configuring for GitHub Copilot..."
    mkdir -p .github
    create_symlink "../AGENTS.md" ".github/copilot-instructions.md"
    create_symlink "../.agents/personas" ".github/agents"
    echo "GitHub Copilot setup completed successfully!"
    echo
}

clean_symlinks() {
    echo "Cleaning all symlinks..."
    
    symlinks=(
        "CLAUDE.md"
        "GEMINI.md"
        ".claude/skills"
        ".claude/agents"
        ".claude/commands"
        ".cursor/skills"
        "CODEX.md"
        ".windsurfrules"
        ".windsurf/rules/coding.md"
        ".windsurf/rules/security.md"
        ".windsurf/rules/style.md"
        ".github/copilot-instructions.md"
        ".github/agents"
    )
    
    for link in "${symlinks[@]}"; do
        if [ -L "$link" ]; then
            echo "Removing symlink: $link"
            rm "$link"
        fi
    done
    
    # Remove generated files (not symlinks)
    [ -f ".cursor/rules/agents.mdc" ] && rm ".cursor/rules/agents.mdc" && echo "Removing generated: .cursor/rules/agents.mdc"
    
    # Remove directories if they are empty
    [ -d ".windsurf/rules" ] && rmdir .windsurf/rules 2>/dev/null || true
    [ -d .windsurf ] && rmdir .windsurf 2>/dev/null || true
    [ -d .claude ] && rmdir .claude 2>/dev/null || true
    [ -d ".cursor/rules" ] && rmdir .cursor/rules 2>/dev/null || true
    [ -d .cursor ] && rmdir .cursor 2>/dev/null || true
    [ -d .github ] && rmdir .github 2>/dev/null || true
    
    echo "Cleanup complete!"
    echo
}

TOOL="${1:-}"

if [ -z "$TOOL" ]; then
    show_help
    exit 0
fi

case "$TOOL" in
    claude)
        setup_claude
        ;;
    cursor)
        setup_cursor
        ;;
    codex)
        setup_codex
        ;;
    gemini)
        setup_gemini
        ;;
    windsurf)
        setup_windsurf
        ;;
    copilot)
        setup_copilot
        ;;
    all)
        setup_gemini
        setup_claude
        setup_cursor
        setup_codex
        setup_windsurf
        setup_copilot
        ;;
    clean)
        clean_symlinks
        ;;
    -h|--help)
        show_help
        ;;
    *)
        echo "Error: Unknown tool '$TOOL'"
        show_help
        exit 1
        ;;
esac
