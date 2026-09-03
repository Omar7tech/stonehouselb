<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@stonehouselb.com'],
            [
                'email' => 'admin@stonehouselb.com',
                'name' => 'Admin',
                'password' => bcrypt('password'),
            ]
        );

        /* $this->call(MenuSeeder::class); */
    }
}
