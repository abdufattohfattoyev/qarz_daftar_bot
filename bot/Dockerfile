FROM python:3.11-slim
WORKDIR /app
RUN pip install requests
COPY bot.py .
COPY assets ./assets
CMD ["python", "-u", "bot.py"]
