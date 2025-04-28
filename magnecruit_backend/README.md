# Magnecruit Backend

This is the backend API for the Magnecruit recruitment application.

## Setup and Installation

1. Clone the repository
2. Create and activate a virtual environment:

```bash
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Set up environment variables (create a `.env` file):

```
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///app.db
OPENAI_API_KEY=your-openai-api-key
```

## LinkedIn Post Generator with CrewAI

The LinkedIn post generator feature uses CrewAI to create engaging job posts. To set it up:

1. Install CrewAI:

```bash
pip install crewai
```

2. Additional packages required for CrewAI:

```bash
pip install 'crewai[tools]'
```

3. Update your `.env` file with necessary AI keys:

```
OPENAI_API_KEY=your-openai-api-key
# Optional - if using other LLM providers
ANTHROPIC_API_KEY=your-anthropic-key
```

### How the LinkedIn Post Generator Works

The LinkedIn post generator uses CrewAI to orchestrate a team of AI agents:

1. A LinkedIn Content Creator agent generates the initial post based on job details
2. A Marketing Specialist agent reviews and optimizes the post for engagement
3. The system returns the final polished post ready to be shared on LinkedIn

This multi-agent approach ensures posts are both informative and engaging, following LinkedIn best practices.

**Detailed Implementation Guide**: For a complete implementation guide with code examples, see the [CrewAI Implementation Documentation](docs/crewai_implementation.md).

## Running the Application

Start the Flask development server:

```bash
flask run
```

Or use:

```bash
python run.py
```

The server will be available at http://localhost:5000

## API Endpoints

### LinkedIn Post Generator

-   **POST** `/api/linkedin/generate-post`
    -   Generates LinkedIn post for job postings
    -   Parameters:
        -   `jobTitle` (required): Title of the job
        -   `companyName` (required): Company name
        -   `jobDescription` (optional): Description of the job
        -   `tone` (optional): Tone of the post (professional, conversational, enthusiastic, formal)
        -   `length` (optional): Length of the post (short, medium, long)
    -   Returns: Generated LinkedIn post content

## Development

To modify or extend the CrewAI LinkedIn post generator:

1. Edit the implementation in `app/services/linkedin_service.py`
2. Customize the agents and tasks to meet your specific needs
3. Add additional agents for more specialized content generation

## Testing

Run tests:

```bash
pytest
```
