import {Component, ViewChild, ElementRef, OnInit, OnDestroy} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-root',
  template: `
    <div class="container">
      <div class="content-wrapper">
        <h1 class="title">BL use case example</h1>

        <div class="form-group">
          <label class="input-label">Select Input Type</label>
          <div class="radio-group">
            <label>
              <input type="radio" name="inputType" value="file" [(ngModel)]="inputType" /> File Name
            </label>
            <label>
              <input type="radio" name="inputType" value="markdown" [(ngModel)]="inputType" /> Markdown Text
            </label>
            <label>
              <input type="radio" name="inputType" value="message" [(ngModel)]="inputType" /> Post Message
            </label>
          </div>
        </div>

        <div class="form-group" *ngIf="inputType === 'file'">
          <label for="fileName" class="input-label">File Name</label>
          <input
            type="text"
            id="fileName"
            [(ngModel)]="inputText"
            class="text-filename"
            placeholder="Enter file name..."
            (keyup.enter)="updateIframeUrl()"
          />
        </div>

        <div class="form-group" *ngIf="inputType === 'markdown'">
          <textarea
            [(ngModel)]="inputText"
            class="text-input"
            placeholder="Enter your text here..."
            (keyup.enter)="updateIframeUrl()"
          ></textarea>
        </div>

        <div class="form-group" *ngIf="inputType === 'message'">
          <label class="input-label">User Input:</label>
          <textarea
            [(ngModel)]="inputText"
            class="text-input"
            placeholder="Enter text here..."
            (keyup.enter)="updateIframeUrl()"
          ></textarea>

          <label class="input-label">Generated output:</label>
          <textarea
            [(ngModel)]="outputText"
            class="text-input"
            placeholder="Enter text here..."
            (keyup.enter)="updateIframeUrl()"
          ></textarea>
        </div>

        <div class="button-group">
          <button
            class="submit-button"
            (click)="updateIframeUrl()"
            (click)="setCookie('JWT_TOKEN', 'insert you token here')"
            (click)="setCookie('IDSID', 'ishok')"
          >
            Edit in Canvas
          </button>
        </div>

        <div class="iframe-container" *ngIf="iframeUrl">
          <iframe
            #reactIframe
            id="reactIframe"
            [src]="iframeUrl"
            frameborder="0"
            class="responsive-iframe"
            (load)="sendMessageToIframe()"
          ></iframe>
        </div>
      </div>
    </div>
  `,
  imports: [FormsModule, NgIf],
  styles: [`
    .container {
      min-height: 90vh;
      padding: 2rem;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }

    .content-wrapper {
      max-width: 100vw;
      margin: 0 auto;
      padding: 1rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }

    .title {
      color: #2d3748;
      font-size: 1.8rem;
      margin-bottom: 1.5rem;
      text-align: center;
      font-weight: 600;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .radio-group {
      display: flex;
      gap: 1rem;
    }

    .input-label {
      font-size: 1rem;
      font-weight: 600;
      color: #4a5568;
    }

    .text-filename, .text-input {
      width: 90vw;
      padding: 0.75rem;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s;
      outline: none;
    }

    .text-filename:focus, .text-input:focus {
      border-color: #4299e1;
      box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
    }

    .button-group {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .submit-button {
      padding: 0.75rem 1.5rem;
      background-color: #4299e1;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .submit-button:hover {
      background-color: #3182ce;
    }

    .iframe-container {
      position: relative;
      width: 100%;
      height: 65vh;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      z-index: 1000;
    }

    .responsive-iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('reactIframe', {static: false}) reactIframe!: ElementRef<HTMLIFrameElement>;
  inputText: string = '';
  outputText: string = '';
  inputType: string = 'file';
  iframeUrl: SafeResourceUrl | null = null;
  private baseUrl = 'http://localhost:3000/artifact/';

  reactReady: boolean = false;
  postMessageSent: boolean = false;

  constructor(private sanitizer: DomSanitizer) {
  }

  ngOnInit() {
    window.addEventListener('message', this.handleReadyMessage.bind(this));
  }

  ngOnDestroy() {
    window.removeEventListener('message', this.handleReadyMessage.bind(this));
  }

  handleReadyMessage(event: MessageEvent<any>) {
    if (event.data && event.data.type === 'CANVAS_READY' && !this.postMessageSent) {
      console.log('Canvas app is ready.');
      this.reactReady = true;
      if (this.inputType === 'message') {
        this.sendMessageToIframe();
      }
    }
  }

  setCookie(name: string, value: string, domain?: string): void {
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
    let cookieString = `${name}=${value}; expires=${expires}; path=/`;
    if (domain) {
      cookieString += `; domain=${domain}`;
    }
    if (window.location.protocol === 'https:') {
      cookieString += `; SameSite=None; Secure`;
    }
    document.cookie = cookieString;
  }

  updateIframeUrl() {
    if (this.inputText) {
      let url;
      if (this.inputType === 'file' || this.inputType === 'markdown') {
        url = `${this.baseUrl}?artifact_source=${this.inputType}&artifact_data=${encodeURIComponent(this.inputText)}`;
        this.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      } else {
        url = `${this.baseUrl}?artifact_source=post_message`;
        this.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      }
    }
  }

  sendMessageToIframe() {
    if (this.reactReady && !this.postMessageSent) {
      const data = {
        input: this.inputText,
        output: this.outputText,
      };

      const iframeEl = this.reactIframe?.nativeElement;
      if (iframeEl?.contentWindow) {
        const payload = {
          type: 'CANVAS_STATE',
          payload: {
            type: 'code',
            language: 'rtl',
            data: data,
          },
        };
        console.log(`Sending payload:`, payload);
        iframeEl.contentWindow.postMessage(payload, '*');
        this.postMessageSent = true;
      } else {
        console.error('Failed to send message: Iframe not ready after maximum attempts.');
      }
    }
  };
}
