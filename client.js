
    document.querySelector('form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const messageElement = document.getElementById('responseMessage');

    try {
        const response = await fetch('/write', {
        method: 'POST',
        body: formData
        });

    if (response.status === 201) {
        messageElement.textContent = 'Нотатку успішно створено!';
    this.reset();
        } else if (response.status === 400) {
        messageElement.textContent = 'Помилка: Нотатка з таким іменем вже існує';
        } else {
        messageElement.textContent = 'Помилка при створенні нотатки';
        }
      } catch (error) {
        messageElement.textContent = 'Помилка при відправці форми';
      }
    });
