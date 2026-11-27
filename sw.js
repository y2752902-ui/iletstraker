<div class="sync-controls">
        <input id="emailInput" type="email" placeholder="你的邮箱">
        <button id="loginBtn" class="button button-small button-quiet" type="button">发送验证码</button>
        
        <input id="emailOtp" type="text" placeholder="输入邮件里的 6 位验证码" maxlength="6" hidden>
        <button id="verifyBtn" class="button button-small button-primary" type="button" hidden>验证并登录</button>
        
        <button id="logoutBtn" class="button button-small button-quiet" type="button" hidden>退出</button>
        <span id="syncStatus">未登录：只保存在本机</span>
      </div>
