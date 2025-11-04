# Contributing to Text Wingman

Thank you for your interest in contributing! 🎉

## Development Setup

1. Fork the repository
2. Clone your fork:
```bash
git clone https://github.com/your-username/text-wingman.git
cd text-wingman
```

3. Install dependencies:
```bash
npm install
```

4. Set up environment variables (see SETUP_GUIDE.md)

5. Create a branch:
```bash
git checkout -b feature/your-feature-name
```

## Development Guidelines

### Code Style

- TypeScript for all new code
- Use functional components with hooks
- Follow existing naming conventions
- Add comments for complex logic
- Keep functions small and focused

### Commit Messages

Follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

Example:
```
feat: add share card generation
fix: resolve rate limiting issue
docs: update README with new features
```

### Testing

Before submitting:

1. Test locally:
```bash
npm run dev
```

2. Test the main flows:
   - Landing page loads
   - AI generation works
   - Pricing page displays
   - Test page functions

3. Check for TypeScript errors:
```bash
npm run build
```

### Pull Request Process

1. Update documentation if needed
2. Add screenshots for UI changes
3. Describe what changed and why
4. Reference any related issues
5. Ensure all checks pass

## Areas to Contribute

### High Priority
- [ ] User authentication (Supabase Auth)
- [ ] Share card image generation
- [ ] Conversation history
- [ ] Mobile responsiveness improvements

### Features
- [ ] More tone options (Professional, Funny, Sarcastic)
- [ ] Custom AI prompts
- [ ] Browser extension
- [ ] Mobile app

### Bugs & Improvements
- [ ] Better error handling
- [ ] Performance optimizations
- [ ] Accessibility improvements
- [ ] SEO enhancements

### Documentation
- [ ] Video tutorials
- [ ] API documentation
- [ ] Architecture diagrams
- [ ] Use case examples

## Questions?

- Open an issue for bugs
- Start a discussion for ideas
- Join our Discord for chat

## Code of Conduct

- Be respectful and inclusive
- Help others learn
- Give constructive feedback
- Have fun building! 🚀

Thank you for contributing!
